import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { reasignarBarbero } from "@/lib/reservas/reasignacion";
import { TIMEOUT_ACEPTACION_MINUTOS } from "@/lib/reservas/config";

// Salvaguarda contra loops infinitos — en la práctica el proceso termina
// antes, cuando reasignarBarbero se queda sin candidatos y marca REQUIERE_ADMIN.
const MAX_INTENTOS_REASIGNACION = 5;

export const reasignarCitaSiNoResponde = inngest.createFunction(
  {
    id: "reasignar-cita-si-no-responde",
    triggers: [{ event: "cita/creada" }],
  },
  async ({ event, step }) => {
    const { citaId } = event.data as { citaId: string };

    for (let intento = 0; intento < MAX_INTENTOS_REASIGNACION; intento++) {
      // No asumimos que la oferta actual empezó cuando arrancó este loop —
      // un rechazo manual del barbero (panel de barbero) puede haber
      // reiniciado el reloj hace poco. Miramos el IntentoAsignacion
      // "OFRECIDO" real y dormimos hasta SU límite de 15 min, no un ciclo
      // fijo — así un barbero reasignado manualmente sí recibe su ventana
      // completa en vez de heredar el tiempo restante del anterior.
      const estadoActual = await step.run(`obtener-oferta-vigente-${intento}`, async () => {
        const cita = await prisma.cita.findUnique({
          where: { id: citaId },
          select: { estado: true, estadoBarbero: true },
        });
        const ofertaVigente = await prisma.intentoAsignacion.findFirst({
          where: { citaId, estado: "OFRECIDO" },
          orderBy: { orden: "desc" },
        });
        return {
          activa: !!cita && cita.estado !== "CANCELADA" && cita.estadoBarbero === "PENDIENTE",
          limiteMs: ofertaVigente
            ? ofertaVigente.ofrecidoEn.getTime() + TIMEOUT_ACEPTACION_MINUTOS * 60 * 1000
            : null,
        };
      });

      if (!estadoActual.activa || !estadoActual.limiteMs) {
        return { resultado: "resuelta-antes-del-timeout" };
      }

      await step.sleepUntil(`esperar-oferta-${intento}`, new Date(estadoActual.limiteMs));

      const siguePendiente = await step.run(`verificar-estado-${intento}`, async () => {
        const cita = await prisma.cita.findUnique({
          where: { id: citaId },
          select: { estadoBarbero: true, estado: true },
        });
        return cita?.estadoBarbero === "PENDIENTE" && cita.estado !== "CANCELADA";
      });

      if (!siguePendiente) {
        return { resultado: "resuelta-antes-del-timeout" };
      }

      const resultado = await step.run(`reasignar-${intento}`, () =>
        reasignarBarbero(citaId)
      );

      if (resultado.tipo === "requiere_admin") {
        return { resultado: "requiere-admin" };
      }
    }

    return { resultado: "limite-de-reintentos-alcanzado" };
  }
);
