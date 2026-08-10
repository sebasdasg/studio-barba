// El documento de requerimientos no especifica duración por corte, así que
// usamos una duración fija por cita para poder calcular horarios disponibles.
// Fácil de ajustar acá si más adelante se necesita por-corte.
export const DURACION_CITA_MINUTOS = 45;

// Cada cuántos minutos se ofrece un horario de inicio distinto.
export const INTERVALO_SLOTS_MINUTOS = 30;

// Ventana de respuesta del barbero antes de reasignar (B2/B3).
export const TIMEOUT_ACEPTACION_MINUTOS = 15;

// Penalidad por cancelación fuera de la ventana permitida (sección 4).
export const PENALIDAD_CANCELACION_PORCENTAJE = 15;
export const VENTANA_CANCELACION_SIN_PENALIDAD_MINUTOS = 60;

// Un turno de barbero de 7h o más lleva 1h de refrigerio obligatorio,
// calculado automáticamente a la mitad del turno.
export const UMBRAL_REFRIGERIO_MINUTOS = 7 * 60;
export const DURACION_REFRIGERIO_MINUTOS = 60;
