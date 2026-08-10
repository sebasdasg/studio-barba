"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export type CalificarState = { error?: string; ok?: boolean };

export async function calificarCita(
  _prevState: CalificarState,
  formData: FormData
): Promise<CalificarState> {
  const session = await auth();
  if (!session?.user) return { error: "Debes iniciar sesión." };

  const citaId = formData.get("citaId");
  const estrellasRaw = formData.get("estrellas");
  const comentario = formData.get("comentario");

  if (typeof citaId !== "string" || typeof estrellasRaw !== "string") {
    return { error: "Datos inválidos." };
  }

  const estrellas = Number(estrellasRaw);
  if (!Number.isInteger(estrellas) || estrellas < 1 || estrellas > 5) {
    return { error: "Elige de 1 a 5 estrellas." };
  }

  const cita = await prisma.cita.findUnique({ where: { id: citaId } });
  if (!cita || cita.clienteId !== session.user.id) {
    return { error: "Cita no encontrada." };
  }
  if (cita.estado !== "COMPLETADA") {
    return { error: "Solo puedes calificar un servicio ya terminado." };
  }
  if (cita.calificacionEstrellas !== null) {
    return { error: "Ya calificaste esta cita." };
  }

  await prisma.cita.update({
    where: { id: citaId },
    data: {
      calificacionEstrellas: estrellas,
      calificacionComentario:
        typeof comentario === "string" && comentario.trim() ? comentario.trim() : null,
      calificadaEn: new Date(),
    },
  });

  revalidatePath("/cuenta/citas");
  return { ok: true };
}
