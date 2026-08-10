"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import {
  DURACION_CITA_MINUTOS,
} from "@/lib/reservas/config";
import {
  fechaISOaDate,
  horaAMinutos,
  horaActualEnNegocio,
  hoyISOEnNegocio,
  minutosAHora,
} from "@/lib/reservas/horario";
import { revalidatePath } from "next/cache";

async function obtenerBarberoDeSesion() {
  const session = await auth();
  if (!session?.user || session.user.rol !== "BARBERO") return null;
  return prisma.barbero.findUnique({ where: { userId: session.user.id } });
}

export async function buscarClientes(
  query: string
): Promise<{ id: string; nombre: string; celular: string | null }[]> {
  const barbero = await obtenerBarberoDeSesion();
  if (!barbero) return [];

  const q = query.trim();
  if (q.length < 2) return [];

  return prisma.user.findMany({
    where: {
      rol: "CLIENTE",
      OR: [{ nombre: { contains: q, mode: "insensitive" } }, { celular: { contains: q } }],
    },
    select: { id: true, nombre: true, celular: true },
    orderBy: { nombre: "asc" },
    take: 8,
  });
}

export type RegistrarServicioState = { error?: string; ok?: boolean };

export async function registrarServicio(params: {
  clienteId: string | null;
  corteId: string;
  adicionalesIds: string[];
}): Promise<RegistrarServicioState> {
  const barbero = await obtenerBarberoDeSesion();
  if (!barbero) return { error: "No autorizado." };

  const puedeHacerlo = await prisma.barberoCorte.findUnique({
    where: { barberoId_corteId: { barberoId: barbero.id, corteId: params.corteId } },
  });
  if (!puedeHacerlo) return { error: "No realizas este corte." };

  const corte = await prisma.corte.findUnique({ where: { id: params.corteId } });
  if (!corte || !corte.activo) return { error: "Corte no disponible." };

  if (params.clienteId) {
    const cliente = await prisma.user.findUnique({ where: { id: params.clienteId } });
    if (!cliente || cliente.rol !== "CLIENTE") return { error: "Cliente no encontrado." };
  }

  const adicionales =
    params.adicionalesIds.length > 0
      ? await prisma.adicional.findMany({
          where: { id: { in: params.adicionalesIds }, activo: true },
        })
      : [];

  const horaInicio = horaActualEnNegocio();
  const horaFin = minutosAHora(horaAMinutos(horaInicio) + DURACION_CITA_MINUTOS);

  await prisma.$transaction(async (tx) => {
    const cita = await tx.cita.create({
      data: {
        sedeId: barbero.sedeId,
        clienteId: params.clienteId,
        corteId: params.corteId,
        precioCorte: corte.precio,
        barberoId: barbero.id,
        fecha: fechaISOaDate(hoyISOEnNegocio()),
        horaInicio,
        horaFin,
        estado: "CONFIRMADA",
        estadoBarbero: "ACEPTADA",
        esPresencial: true,
      },
    });

    if (adicionales.length > 0) {
      await tx.citaAdicional.createMany({
        data: adicionales.map((a) => ({
          citaId: cita.id,
          adicionalId: a.id,
          precio: a.precio,
        })),
      });
    }

    await tx.intentoAsignacion.create({
      data: {
        citaId: cita.id,
        barberoId: barbero.id,
        orden: 1,
        estado: "ACEPTADO",
        respondidoEn: new Date(),
      },
    });
  });

  revalidatePath("/barbero");
  return { ok: true };
}
