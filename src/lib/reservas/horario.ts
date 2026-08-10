import {
  DURACION_REFRIGERIO_MINUTOS,
  INTERVALO_SLOTS_MINUTOS,
  UMBRAL_REFRIGERIO_MINUTOS,
} from "./config";

// Todas las fechas "de calendario" (sin hora) del flujo de reservas se
// anclan en UTC — nunca en la hora local del servidor. Si mezclamos Date
// locales con Date UTC, un mismo día puede desplazarse (ej. "2026-08-09"
// mostrado como sábado 8 si el servidor corre detrás de UTC). Usa siempre
// fechaISOaDate/diaSemanaUTC/inicioDelDia/finDelDia de este archivo para
// trabajar con estas fechas, nunca new Date(...) + getDay()/setHours() a mano.

export const ZONA_HORARIA_NEGOCIO = "America/Lima";

export function horaAMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

export function minutosAHora(minutos: number): string {
  const h = Math.floor(minutos / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutos % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Refrigerio automático de un turno de barbero: si dura 7h o más, se resta
 * 1h a la mitad del turno, redondeada al mismo grid de 30min que usan los
 * slots (relativo al inicio del turno, no a las 00:00). Devuelve null si el
 * turno no llega al umbral.
 */
export function calcularRefrigerio(
  inicioMin: number,
  finMin: number
): { inicio: number; fin: number } | null {
  const duracion = finMin - inicioMin;
  if (duracion < UMBRAL_REFRIGERIO_MINUTOS) return null;

  const mitadBruta = inicioMin + duracion / 2 - DURACION_REFRIGERIO_MINUTOS / 2;
  const pasos = Math.round((mitadBruta - inicioMin) / INTERVALO_SLOTS_MINUTOS);
  const inicio = inicioMin + pasos * INTERVALO_SLOTS_MINUTOS;
  return { inicio, fin: inicio + DURACION_REFRIGERIO_MINUTOS };
}

export function seSolapan(
  aInicio: number,
  aFin: number,
  bInicio: number,
  bFin: number
): boolean {
  return aInicio < bFin && bInicio < aFin;
}

/** "2026-08-09" -> Date anclado a medianoche UTC de ese día. */
export function fechaISOaDate(fechaISO: string): Date {
  return new Date(`${fechaISO}T00:00:00.000Z`);
}

/** Día de la semana (0=domingo..6=sábado) de un Date anclado en UTC. */
export function diaSemanaUTC(fecha: Date): number {
  return fecha.getUTCDay();
}

/** "YYYY-MM-DD" de hoy en la zona horaria del negocio (Lima). */
export function hoyISOEnNegocio(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA_HORARIA_NEGOCIO }).format(new Date());
}

/** "HH:MM" de la hora actual en la zona horaria del negocio (Lima). */
export function horaActualEnNegocio(): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONA_HORARIA_NEGOCIO,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
}

export function inicioDelDia(fecha: Date): Date {
  const d = new Date(fecha);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function finDelDia(fecha: Date): Date {
  const d = new Date(fecha);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

// Lima no observa horario de verano — el offset es siempre UTC-5, todo el año.
const LIMA_OFFSET_HORAS = 5;

/**
 * Instante real (UTC) en el que empieza una cita, combinando su fecha
 * (ancla UTC de un día calendario en Lima) con su horaInicio ("HH:MM",
 * hora local de Lima). Úsalo para comparar contra "ahora" — ej. la
 * ventana de 1 hora para cancelar sin penalidad.
 */
export function fechaHoraCitaAInstante(fecha: Date, horaInicio: string): Date {
  const minutos = horaAMinutos(horaInicio);
  return new Date(
    Date.UTC(
      fecha.getUTCFullYear(),
      fecha.getUTCMonth(),
      fecha.getUTCDate(),
      Math.floor(minutos / 60) + LIMA_OFFSET_HORAS,
      minutos % 60
    )
  );
}
