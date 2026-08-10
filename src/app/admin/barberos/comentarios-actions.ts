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

export async function publicarComentario(citaId: string, publicar: boolean): Promise<Resultado> {
  const admin = await requireAdmin();
  if (!admin) return { error: "No autorizado." };

  const cita = await prisma.cita.findUnique({ where: { id: citaId } });
  if (!cita || cita.calificacionEstrellas === null) {
    return { error: "Esta cita no tiene calificación." };
  }

  await prisma.cita.update({
    where: { id: citaId },
    data: { calificacionPublicada: publicar },
  });

  revalidatePath("/admin/barberos");
  revalidatePath("/");
  return { ok: true };
}
