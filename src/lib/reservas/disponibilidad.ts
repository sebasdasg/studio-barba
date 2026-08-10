import { prisma } from "@/lib/prisma";
import { DURACION_CITA_MINUTOS, INTERVALO_SLOTS_MINUTOS } from "./config";
import {
  calcularRefrigerio,
  diaSemanaUTC,
  finDelDia,
  horaActualEnNegocio,
  hoyISOEnNegocio,
  horaAMinutos,
  inicioDelDia,
  minutosAHora,
  seSolapan,
} from "./horario";

export type SlotDisponibilidad = {
  horaInicio: string;
  horaFin: string;
  disponible: boolean;
  barberosLibresIds: string[];
};

type Ocupacion = { inicio: number; fin: number };

async function obtenerOcupacionPorBarbero(candidatoIds: string[], fecha: Date) {
  const inicio = inicioDelDia(fecha);
  const fin = finDelDia(fecha);

  const [citas, bloqueos] = await Promise.all([
    prisma.cita.findMany({
      where: {
        barberoId: { in: candidatoIds },
        fecha: { gte: inicio, lte: fin },
        estado: { notIn: ["CANCELADA"] },
      },
      select: { barberoId: true, horaInicio: true, horaFin: true },
    }),
    prisma.bloqueoHorario.findMany({
      where: { barberoId: { in: candidatoIds }, fecha: { gte: inicio, lte: fin } },
      select: { barberoId: true, horaInicio: true, horaFin: true },
    }),
  ]);

  const ocupacion = new Map<string, Ocupacion[]>();
  for (const id of candidatoIds) ocupacion.set(id, []);
  for (const c of citas) {
    if (!c.barberoId) continue;
    ocupacion.get(c.barberoId)?.push({ inicio: horaAMinutos(c.horaInicio), fin: horaAMinutos(c.horaFin) });
  }
  for (const b of bloqueos) {
    ocupacion.get(b.barberoId)?.push({ inicio: horaAMinutos(b.horaInicio), fin: horaAMinutos(b.horaFin) });
  }
  return ocupacion;
}

/**
 * Turno propio (horario individual) de cada candidato para ese día de la
 * semana. Un barbero sin fila para ese diaSemana no trabaja ese día —
 * queda fuera del mapa devuelto (no del array de candidatoIds original).
 */
async function obtenerTurnosBarberos(candidatoIds: string[], diaSemana: number) {
  const horarios = await prisma.barberoHorario.findMany({
    where: { barberoId: { in: candidatoIds }, diaSemana },
    select: { barberoId: true, horaInicio: true, horaFin: true },
  });

  const turnos = new Map<string, Ocupacion>();
  for (const h of horarios) {
    turnos.set(h.barberoId, { inicio: horaAMinutos(h.horaInicio), fin: horaAMinutos(h.horaFin) });
  }
  return turnos;
}

/**
 * Barberos activos de la sede que hacen el corte dado. Si se pasa
 * `barberoId`, restringe a ese barbero (para cuando el cliente ya eligió
 * uno específico y solo queremos validar/mostrar su propia disponibilidad).
 */
export async function obtenerCandidatos(params: {
  sedeId: string;
  corteId: string;
  barberoId?: string;
}) {
  const { sedeId, corteId, barberoId } = params;
  const barberos = await prisma.barbero.findMany({
    where: {
      sedeId,
      activo: true,
      ...(barberoId ? { id: barberoId } : {}),
      cortes: { some: { corteId } },
    },
    select: { id: true },
  });
  return barberos.map((b) => b.id);
}

/**
 * Slots de un día para un corte dado, marcando cuáles barberos candidatos
 * están libres en cada uno. Un slot es "disponible" si al menos un
 * candidato está libre.
 */
export async function obtenerSlotsDelDia(params: {
  sedeId: string;
  corteId: string;
  fecha: Date;
  barberoId?: string;
}): Promise<SlotDisponibilidad[]> {
  const { sedeId, corteId, fecha, barberoId } = params;

  const horario = await prisma.horarioAtencion.findUnique({
    where: { sedeId_diaSemana: { sedeId, diaSemana: diaSemanaUTC(fecha) } },
  });
  if (!horario) return [];

  const candidatosPosibles = await obtenerCandidatos({ sedeId, corteId, barberoId });
  if (candidatosPosibles.length === 0) return [];

  const diaSemana = diaSemanaUTC(fecha);
  const turnos = await obtenerTurnosBarberos(candidatosPosibles, diaSemana);
  // Solo trabajan ese día los que tienen fila en BarberoHorario para él.
  const candidatoIds = candidatosPosibles.filter((id) => turnos.has(id));
  if (candidatoIds.length === 0) return [];

  const ocupacion = await obtenerOcupacionPorBarbero(candidatoIds, fecha);
  for (const id of candidatoIds) {
    const turno = turnos.get(id)!;
    const refrigerio = calcularRefrigerio(turno.inicio, turno.fin);
    if (refrigerio) ocupacion.get(id)?.push(refrigerio);
  }

  const aperturaMin = horaAMinutos(horario.horaInicio);
  const cierreMin = horaAMinutos(horario.horaFin);

  // Si se pide el día de hoy, no ofrecemos horarios que ya pasaron — pero
  // manteniendo alineados los slots a la grilla original (cada :00/:30),
  // no saltando directo a la hora exacta actual.
  const esHoy = fecha.toISOString().slice(0, 10) === hoyISOEnNegocio();
  const minimoMin = esHoy ? horaAMinutos(horaActualEnNegocio()) : aperturaMin;
  const pasosAOmitir = Math.max(0, Math.ceil((minimoMin - aperturaMin) / INTERVALO_SLOTS_MINUTOS));
  const inicioLoop = aperturaMin + pasosAOmitir * INTERVALO_SLOTS_MINUTOS;

  const slots: SlotDisponibilidad[] = [];
  for (
    let inicio = inicioLoop;
    inicio + DURACION_CITA_MINUTOS <= cierreMin;
    inicio += INTERVALO_SLOTS_MINUTOS
  ) {
    const fin = inicio + DURACION_CITA_MINUTOS;
    const libres = candidatoIds.filter((id) => {
      const turno = turnos.get(id)!;
      if (inicio < turno.inicio || fin > turno.fin) return false;
      const ocupaciones = ocupacion.get(id) ?? [];
      return !ocupaciones.some((o) => seSolapan(inicio, fin, o.inicio, o.fin));
    });
    slots.push({
      horaInicio: minutosAHora(inicio),
      horaFin: minutosAHora(fin),
      disponible: libres.length > 0,
      barberosLibresIds: libres,
    });
  }
  return slots;
}

/**
 * De una lista de barberos ya filtrados como disponibles para un slot,
 * elige uno según la regla de negocio: menor carga de citas ese día,
 * empate al azar entre los que tengan la menor carga.
 */
export async function elegirBarberoPorCarga(
  candidatoIds: string[],
  fecha: Date
): Promise<string> {
  if (candidatoIds.length === 1) return candidatoIds[0];

  const conteos = await prisma.cita.groupBy({
    by: ["barberoId"],
    where: {
      barberoId: { in: candidatoIds },
      fecha: { gte: inicioDelDia(fecha), lte: finDelDia(fecha) },
      estado: { notIn: ["CANCELADA"] },
    },
    _count: { _all: true },
  });

  const cargaPorId = new Map(candidatoIds.map((id) => [id, 0]));
  for (const c of conteos) {
    if (c.barberoId) cargaPorId.set(c.barberoId, c._count._all);
  }

  const minCarga = Math.min(...candidatoIds.map((id) => cargaPorId.get(id) ?? 0));
  const empatados = candidatoIds.filter((id) => (cargaPorId.get(id) ?? 0) === minCarga);

  return empatados[Math.floor(Math.random() * empatados.length)];
}
