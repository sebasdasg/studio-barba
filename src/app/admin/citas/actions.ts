"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

type Resultado = { error: string } | { ok: true };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.rol !== "ADMIN") return null;
  return session.user;
}

export async function asignarBarberoManualmente(
  citaId: string,
  barberoId: string
): Promise<Resultado> {
  const admin = await requireAdmin();
  if (!admin) return { error: "No autorizado." };

  const cita = await prisma.cita.findUnique({ where: { id: citaId } });
  if (!cita) return { error: "Cita no encontrada." };
  if (cita.estado !== "REQUIERE_ADMIN") {
    return { error: "Esta cita ya no requiere asignación manual." };
  }

  const barbero = await prisma.barbero.findUnique({ where: { id: barberoId } });
  if (!barbero || !barbero.activo) return { error: "Barbero no válido." };

  const intentosPrevios = await prisma.intentoAsignacion.count({ where: { citaId } });

  await prisma.$transaction([
    prisma.cita.update({
      where: { id: citaId },
      data: { barberoId, estado: "CONFIRMADA", estadoBarbero: "ASIGNADA_POR_ADMIN" },
    }),
    prisma.intentoAsignacion.create({
      data: {
        citaId,
        barberoId,
        orden: intentosPrevios + 1,
        estado: "ACEPTADO",
        respondidoEn: new Date(),
        esAsignacionAdmin: true,
        asignadoPorId: admin.id,
      },
    }),
  ]);

  revalidatePath("/admin/citas");
  return { ok: true };
}
