"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { reasignarBarbero } from "@/lib/reservas/reasignacion";
import { revalidatePath } from "next/cache";

type AccionResultado = { error: string } | { ok: true };

async function obtenerBarberoDeSesion() {
  const session = await auth();
  if (!session?.user || session.user.rol !== "BARBERO") return null;

  const barbero = await prisma.barbero.findUnique({ where: { userId: session.user.id } });
  return barbero;
}

async function obtenerCitaDelBarbero(citaId: string, barberoId: string) {
  const cita = await prisma.cita.findUnique({ where: { id: citaId } });
  if (!cita || cita.barberoId !== barberoId) return null;
  return cita;
}

export async function aceptarCita(citaId: string): Promise<AccionResultado> {
  const barbero = await obtenerBarberoDeSesion();
  if (!barbero) return { error: "No autorizado." };

  const cita = await obtenerCitaDelBarbero(citaId, barbero.id);
  if (!cita) return { error: "Cita no encontrada." };
  if (cita.estadoBarbero !== "PENDIENTE") {
    return { error: "Esta cita ya no está pendiente de tu respuesta." };
  }

  await prisma.$transaction([
    prisma.cita.update({
      where: { id: citaId },
      data: { estadoBarbero: "ACEPTADA", estado: "CONFIRMADA" },
    }),
    prisma.intentoAsignacion.updateMany({
      where: { citaId, barberoId: barbero.id, estado: "OFRECIDO" },
      data: { estado: "ACEPTADO", respondidoEn: new Date() },
    }),
  ]);

  revalidatePath("/barbero");
  return { ok: true };
}

export async function rechazarCita(citaId: string): Promise<AccionResultado> {
  const barbero = await obtenerBarberoDeSesion();
  if (!barbero) return { error: "No autorizado." };

  const cita = await obtenerCitaDelBarbero(citaId, barbero.id);
  if (!cita) return { error: "Cita no encontrada." };
  if (cita.estadoBarbero !== "PENDIENTE") {
    return { error: "Esta cita ya no está pendiente de tu respuesta." };
  }

  // Reutiliza la misma lógica que usa el timeout de 15 min de Inngest —
  // un rechazo explícito reasigna de inmediato, sin esperar el timer.
  await reasignarBarbero(citaId, "RECHAZADO");

  revalidatePath("/barbero");
  return { ok: true };
}

export async function marcarCompletada(citaId: string): Promise<AccionResultado> {
  const barbero = await obtenerBarberoDeSesion();
  if (!barbero) return { error: "No autorizado." };

  const cita = await obtenerCitaDelBarbero(citaId, barbero.id);
  if (!cita) return { error: "Cita no encontrada." };
  if (cita.estado !== "CONFIRMADA") {
    return { error: "Solo se puede completar una cita confirmada." };
  }

  await prisma.cita.update({ where: { id: citaId }, data: { estado: "COMPLETADA" } });

  revalidatePath("/barbero");
  return { ok: true };
}

export async function completarServicioPresencial(
  citaId: string,
  metodoPago: "EFECTIVO" | "YAPE" | "PLIN"
): Promise<AccionResultado> {
  const barbero = await obtenerBarberoDeSesion();
  if (!barbero) return { error: "No autorizado." };

  const cita = await obtenerCitaDelBarbero(citaId, barbero.id);
  if (!cita) return { error: "Servicio no encontrado." };
  if (!cita.esPresencial) return { error: "Este servicio no es presencial." };
  if (cita.estado !== "CONFIRMADA") {
    return { error: "Solo se puede completar un servicio confirmado." };
  }

  const adicionales = await prisma.citaAdicional.findMany({ where: { citaId } });
  const monto =
    Number(cita.precioCorte) + adicionales.reduce((s, a) => s + Number(a.precio), 0);

  await prisma.$transaction([
    prisma.pago.create({
      data: {
        citaId,
        tipo: "TOTAL",
        monto,
        metodoPago,
        estado: "APROBADO",
        validadoPorId: null,
        validadoEn: new Date(),
      },
    }),
    prisma.cita.update({
      where: { id: citaId },
      data: { estado: "COMPLETADA", estadoPago: "APROBADO" },
    }),
  ]);

  revalidatePath("/barbero");
  return { ok: true };
}

export async function marcarNoShow(citaId: string): Promise<AccionResultado> {
  const barbero = await obtenerBarberoDeSesion();
  if (!barbero) return { error: "No autorizado." };

  const cita = await obtenerCitaDelBarbero(citaId, barbero.id);
  if (!cita) return { error: "Cita no encontrada." };
  if (cita.estado !== "CONFIRMADA") {
    return { error: "Solo se puede marcar inasistencia en una cita confirmada." };
  }

  await prisma.cita.update({ where: { id: citaId }, data: { estado: "NO_SHOW" } });

  revalidatePath("/barbero");
  return { ok: true };
}
