"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { inngest } from "@/lib/inngest";
import { obtenerSlotsDelDia, elegirBarberoPorCarga } from "@/lib/reservas/disponibilidad";
import { DURACION_CITA_MINUTOS } from "@/lib/reservas/config";
import { fechaISOaDate, hoyISOEnNegocio, horaAMinutos, minutosAHora } from "@/lib/reservas/horario";
import { cancelarCita, esEstadoActivo, evaluarCancelacion } from "@/lib/reservas/cancelacion";

async function obtenerSedeActiva() {
  const sede = await prisma.sede.findFirst({ where: { activo: true } });
  if (!sede) throw new Error("No hay una sede activa configurada.");
  return sede;
}

export async function obtenerBarberosDeCorte(corteId: string) {
  const barberos = await prisma.barbero.findMany({
    where: { activo: true, cortes: { some: { corteId } } },
    select: { id: true, user: { select: { nombre: true } } },
  });
  return barberos.map((b) => ({ id: b.id, nombre: b.user.nombre }));
}

export async function obtenerSlots(params: {
  corteId: string;
  fecha: string; // "YYYY-MM-DD"
  barberoId?: string;
}) {
  const sede = await obtenerSedeActiva();
  const fecha = fechaISOaDate(params.fecha);
  return obtenerSlotsDelDia({
    sedeId: sede.id,
    corteId: params.corteId,
    fecha,
    barberoId: params.barberoId,
  });
}

/**
 * La cita activa (no terminal) del cliente en sesión, si tiene una — un
 * cliente no puede tener más de una reserva "en curso" a la vez.
 */
export async function obtenerCitaActiva() {
  const session = await auth();
  if (!session?.user) return null;

  const cita = await prisma.cita.findFirst({
    where: {
      clienteId: session.user.id,
      estado: { notIn: ["COMPLETADA", "CANCELADA", "NO_SHOW"] },
    },
    include: { corte: true, barbero: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });
  if (!cita) return null;

  return {
    id: cita.id,
    corteNombre: cita.corte.nombre,
    barberoNombre: cita.barbero?.user.nombre ?? "Por asignar",
    fecha: cita.fecha.toISOString().slice(0, 10),
    horaInicio: cita.horaInicio,
    estado: cita.estado,
  };
}

export async function evaluarCancelacionAction(citaId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Debes iniciar sesión." };

  const cita = await prisma.cita.findUnique({ where: { id: citaId } });
  if (!cita || cita.clienteId !== session.user.id) return { error: "Cita no encontrada." };
  if (!esEstadoActivo(cita.estado)) return { error: "Esta cita ya no se puede cancelar." };

  return evaluarCancelacion(cita);
}

export async function cancelarCitaAction(citaId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Debes iniciar sesión." };

  return cancelarCita(citaId, session.user.id);
}

export type ConfirmarReservaInput = {
  corteId: string;
  barberoId: string | null; // null = primera opción "automático"
  barberoSegundaOpcionId: string | null; // null = segunda opción "automático"
  fecha: string; // "YYYY-MM-DD"
  horaInicio: string; // "HH:MM"
  adicionalesIds: string[];
};

export type ConfirmarReservaResult = { error: string } | { citaId: string };

export async function confirmarReserva(
  input: ConfirmarReservaInput
): Promise<ConfirmarReservaResult> {
  const session = await auth();
  if (!session?.user) return { error: "Debes iniciar sesión." };

  const citaActivaExistente = await prisma.cita.findFirst({
    where: {
      clienteId: session.user.id,
      estado: { notIn: ["COMPLETADA", "CANCELADA", "NO_SHOW"] },
    },
    select: { id: true },
  });
  if (citaActivaExistente) {
    return {
      error:
        "Ya tienes una cita activa. Cancélala o actualízala antes de reservar una nueva.",
    };
  }

  const corte = await prisma.corte.findUnique({
    where: { id: input.corteId, activo: true },
  });
  if (!corte) return { error: "El corte seleccionado ya no está disponible." };

  if (input.barberoId && input.barberoId === input.barberoSegundaOpcionId) {
    return { error: "La segunda opción debe ser distinta de la primera." };
  }

  const sede = await obtenerSedeActiva();
  const fecha = fechaISOaDate(input.fecha);
  if (Number.isNaN(fecha.getTime()) || input.fecha < hoyISOEnNegocio()) {
    return { error: "Fecha inválida." };
  }

  const slots = await obtenerSlotsDelDia({
    sedeId: sede.id,
    corteId: input.corteId,
    fecha,
    barberoId: input.barberoId ?? undefined,
  });
  const slot = slots.find((s) => s.horaInicio === input.horaInicio);
  if (!slot || !slot.disponible) {
    return { error: "Ese horario ya no está disponible, elige otro." };
  }

  let barberoFinalId: string;
  if (input.barberoId) {
    if (!slot.barberosLibresIds.includes(input.barberoId)) {
      return { error: "Ese barbero ya no está disponible en ese horario." };
    }
    barberoFinalId = input.barberoId;
  } else {
    barberoFinalId = await elegirBarberoPorCarga(slot.barberosLibresIds, fecha);
  }

  const adicionales =
    input.adicionalesIds.length > 0
      ? await prisma.adicional.findMany({
          where: { id: { in: input.adicionalesIds }, activo: true },
          select: { id: true, precio: true },
        })
      : [];

  const horaFin = minutosAHora(horaAMinutos(input.horaInicio) + DURACION_CITA_MINUTOS);

  const cita = await prisma.$transaction(async (tx) => {
    const nuevaCita = await tx.cita.create({
      data: {
        sedeId: sede.id,
        clienteId: session.user.id,
        corteId: corte.id,
        precioCorte: corte.precio,
        barberoId: barberoFinalId,
        barberoSegundaOpcionId: input.barberoSegundaOpcionId,
        segundaOpcionAutomatica: input.barberoSegundaOpcionId === null,
        asignacionAutomatica: input.barberoId === null,
        fecha,
        horaInicio: input.horaInicio,
        horaFin,
      },
    });

    if (adicionales.length > 0) {
      await tx.citaAdicional.createMany({
        data: adicionales.map((a) => ({
          citaId: nuevaCita.id,
          adicionalId: a.id,
          precio: a.precio,
        })),
      });
    }

    await tx.intentoAsignacion.create({
      data: { citaId: nuevaCita.id, barberoId: barberoFinalId, orden: 1, estado: "OFRECIDO" },
    });

    // Si el cliente tiene una penalidad de una cancelación anterior sin
    // vincular a ninguna cita todavía, se cobra en esta.
    await tx.penalidad.updateMany({
      where: {
        citaDestinoId: null,
        estado: "PENDIENTE",
        citaOrigen: { clienteId: session.user.id },
      },
      data: { citaDestinoId: nuevaCita.id },
    });

    return nuevaCita;
  });

  try {
    await inngest.send({ name: "cita/creada", data: { citaId: cita.id } });
  } catch (err) {
    // La reserva ya quedó creada — no tumbamos la operación si el bus de
    // eventos no está disponible (ej. Inngest Dev Server apagado en local).
    // Sin este evento no corre el timeout de 15 min de reasignación.
    console.error("No se pudo encolar el evento cita/creada:", err);
  }

  return { citaId: cita.id };
}
