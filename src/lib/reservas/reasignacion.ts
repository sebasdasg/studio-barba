import { prisma } from "@/lib/prisma";
import { obtenerSlotsDelDia, elegirBarberoPorCarga } from "./disponibilidad";

export type ResultadoReasignacion =
  | { tipo: "reasignada"; barberoId: string }
  | { tipo: "requiere_admin" };

/**
 * Pasa la cita al siguiente candidato disponible cuando el barbero
 * actualmente ofrecido no respondió a tiempo (o rechazó explícitamente).
 * Prioriza la segunda opción del cliente si sigue disponible; si no,
 * cae al algoritmo automático (menor carga, empate al azar) excluyendo a
 * todos los barberos ya intentados en esta cita. Si no queda a quién
 * ofrecérsela, la cita pasa a REQUIERE_ADMIN — el admin puede asignarla
 * manualmente sin pasar por este flujo (ver IntentoAsignacion.esAsignacionAdmin).
 */
export async function reasignarBarbero(
  citaId: string,
  motivoIntentoAnterior: "EXPIRADO" | "RECHAZADO" = "EXPIRADO"
): Promise<ResultadoReasignacion> {
  const cita = await prisma.cita.findUniqueOrThrow({ where: { id: citaId } });

  await prisma.intentoAsignacion.updateMany({
    where: { citaId, estado: "OFRECIDO" },
    data: { estado: motivoIntentoAnterior, respondidoEn: new Date() },
  });

  const intentosPrevios = await prisma.intentoAsignacion.findMany({
    where: { citaId },
    select: { barberoId: true },
  });
  const excluidos = new Set(intentosPrevios.map((i) => i.barberoId));

  let candidatoId: string | null = null;

  if (cita.barberoSegundaOpcionId && !excluidos.has(cita.barberoSegundaOpcionId)) {
    const slots = await obtenerSlotsDelDia({
      sedeId: cita.sedeId,
      corteId: cita.corteId,
      fecha: cita.fecha,
      barberoId: cita.barberoSegundaOpcionId,
    });
    const slot = slots.find((s) => s.horaInicio === cita.horaInicio);
    if (slot?.disponible) candidatoId = cita.barberoSegundaOpcionId;
  }

  if (!candidatoId) {
    const slots = await obtenerSlotsDelDia({
      sedeId: cita.sedeId,
      corteId: cita.corteId,
      fecha: cita.fecha,
    });
    const slot = slots.find((s) => s.horaInicio === cita.horaInicio);
    const disponiblesNoIntentados = (slot?.barberosLibresIds ?? []).filter(
      (id) => !excluidos.has(id)
    );
    if (disponiblesNoIntentados.length > 0) {
      candidatoId = await elegirBarberoPorCarga(disponiblesNoIntentados, cita.fecha);
    }
  }

  if (!candidatoId) {
    await prisma.cita.update({
      where: { id: citaId },
      data: { estado: "REQUIERE_ADMIN" },
    });
    return { tipo: "requiere_admin" };
  }

  const siguienteOrden = intentosPrevios.length + 1;

  await prisma.$transaction([
    prisma.cita.update({
      where: { id: citaId },
      data: { barberoId: candidatoId, estadoBarbero: "PENDIENTE" },
    }),
    prisma.intentoAsignacion.create({
      data: { citaId, barberoId: candidatoId, orden: siguienteOrden, estado: "OFRECIDO" },
    }),
  ]);

  return { tipo: "reasignada", barberoId: candidatoId };
}
