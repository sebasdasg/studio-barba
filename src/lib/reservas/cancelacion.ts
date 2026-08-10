import { prisma } from "@/lib/prisma";
import {
  PENALIDAD_CANCELACION_PORCENTAJE,
  VENTANA_CANCELACION_SIN_PENALIDAD_MINUTOS,
} from "./config";
import { fechaHoraCitaAInstante } from "./horario";

// Estados en los que una cita ya no bloquea nuevas reservas ni se puede
// volver a tocar (cancelar/editar). Todo lo demás cuenta como "activa".
export const ESTADOS_TERMINALES = ["COMPLETADA", "CANCELADA", "NO_SHOW"] as const;

export function esEstadoActivo(estado: string): boolean {
  return !(ESTADOS_TERMINALES as readonly string[]).includes(estado);
}

export type EvaluacionCancelacion = {
  penalidadAplica: boolean;
  montoPenalidad: number;
};

export function evaluarCancelacion(cita: {
  fecha: Date;
  horaInicio: string;
  precioCorte: unknown; // Prisma.Decimal
}): EvaluacionCancelacion {
  const instanteCita = fechaHoraCitaAInstante(cita.fecha, cita.horaInicio);
  const limiteSinPenalidad = new Date(
    instanteCita.getTime() - VENTANA_CANCELACION_SIN_PENALIDAD_MINUTOS * 60 * 1000
  );
  const penalidadAplica = new Date() >= limiteSinPenalidad;
  const precioCorte = Number(cita.precioCorte);
  const montoPenalidad = penalidadAplica
    ? Math.round(precioCorte * (PENALIDAD_CANCELACION_PORCENTAJE / 100) * 100) / 100
    : 0;

  return { penalidadAplica, montoPenalidad };
}

export type ResultadoCancelacion =
  | { error: string }
  | { ok: true; penalidadAplicada: boolean; montoPenalidad: number };

/**
 * Cancela una cita del cliente. Si cae dentro de la ventana de 1 hora antes
 * de la hora reservada, genera una Penalidad (15% del corte) — descontando
 * primero cualquier adelanto ya aprobado; el resto queda pendiente para
 * cobrarse en la siguiente cita (se vincula cuando esa cita se crea, ver
 * confirmarReserva en src/app/reservar/actions.ts).
 */
export async function cancelarCita(
  citaId: string,
  clienteId: string
): Promise<ResultadoCancelacion> {
  const cita = await prisma.cita.findUnique({
    where: { id: citaId },
    include: { pagos: true },
  });

  if (!cita || cita.clienteId !== clienteId) {
    return { error: "Cita no encontrada." };
  }
  if (!esEstadoActivo(cita.estado)) {
    return { error: "Esta cita ya no se puede cancelar." };
  }

  const { penalidadAplica, montoPenalidad } = evaluarCancelacion(cita);

  await prisma.$transaction(async (tx) => {
    await tx.cita.update({ where: { id: citaId }, data: { estado: "CANCELADA" } });

    await tx.intentoAsignacion.updateMany({
      where: { citaId, estado: "OFRECIDO" },
      data: { estado: "CANCELADO", respondidoEn: new Date() },
    });

    if (penalidadAplica) {
      const adelantoAprobado = cita.pagos
        .filter((p) => p.tipo === "ADELANTO" && p.estado === "APROBADO")
        .reduce((suma, p) => suma + Number(p.monto), 0);

      const montoDescontadoAdelanto = Math.min(adelantoAprobado, montoPenalidad);
      const saldoPendiente = montoPenalidad - montoDescontadoAdelanto;

      await tx.penalidad.create({
        data: {
          citaOrigenId: citaId,
          montoPenalidad,
          montoDescontadoAdelanto,
          saldoPendiente,
        },
      });
    }
  });

  return { ok: true, penalidadAplicada: penalidadAplica, montoPenalidad };
}
