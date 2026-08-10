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

export async function marcarPenalidadAplicada(penalidadId: string): Promise<Resultado> {
  const admin = await requireAdmin();
  if (!admin) return { error: "No autorizado." };

  const penalidad = await prisma.penalidad.findUnique({ where: { id: penalidadId } });
  if (!penalidad) return { error: "Penalidad no encontrada." };
  if (penalidad.estado !== "PENDIENTE") return { error: "Esta penalidad ya fue marcada como cobrada." };

  await prisma.penalidad.update({
    where: { id: penalidadId },
    data: { estado: "APLICADA" },
  });

  revalidatePath("/admin/penalidades");
  return { ok: true };
}
