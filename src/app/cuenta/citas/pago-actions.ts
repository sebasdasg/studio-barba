"use server";

import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export type SubirComprobanteState = { error?: string; ok?: boolean };

const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024;

export async function subirComprobante(
  _prevState: SubirComprobanteState,
  formData: FormData
): Promise<SubirComprobanteState> {
  const session = await auth();
  if (!session?.user) return { error: "Debes iniciar sesión." };

  const citaId = formData.get("citaId");
  const tipo = formData.get("tipo");
  const montoRaw = formData.get("monto");
  const archivo = formData.get("archivo");

  if (
    typeof citaId !== "string" ||
    typeof montoRaw !== "string" ||
    !(tipo === "ADELANTO" || tipo === "TOTAL") ||
    !(archivo instanceof File) ||
    archivo.size === 0
  ) {
    return { error: "Completa todos los campos y selecciona un archivo." };
  }

  const monto = Number(montoRaw);
  if (!Number.isFinite(monto) || monto <= 0) {
    return { error: "Ingresa un monto válido." };
  }
  if (!archivo.type.startsWith("image/")) {
    return { error: "El comprobante debe ser una imagen." };
  }
  if (archivo.size > TAMANO_MAXIMO_BYTES) {
    return { error: "La imagen no puede pesar más de 5 MB." };
  }

  const cita = await prisma.cita.findUnique({ where: { id: citaId } });
  if (!cita || cita.clienteId !== session.user.id) {
    return { error: "Cita no encontrada." };
  }
  if (cita.estado === "CANCELADA" || cita.estado === "COMPLETADA" || cita.estado === "NO_SHOW") {
    return { error: "Esta cita ya no admite comprobantes." };
  }
  if (cita.estadoPago === "PENDIENTE_VALIDACION" || cita.estadoPago === "APROBADO") {
    return { error: "Esta cita ya tiene un comprobante en revisión o aprobado." };
  }

  const extension = archivo.name.split(".").pop() || "jpg";

  let blob;
  try {
    blob = await put(`comprobantes/${citaId}-${Date.now()}.${extension}`, archivo, {
      access: "private",
      addRandomSuffix: true,
    });
  } catch (err) {
    console.error("Error subiendo comprobante a Vercel Blob:", err);
    return { error: "No se pudo subir el comprobante. Intenta de nuevo." };
  }

  await prisma.$transaction([
    prisma.pago.create({
      data: {
        citaId,
        tipo,
        monto,
        urlComprobante: blob.url,
        estado: "PENDIENTE_VALIDACION",
      },
    }),
    prisma.cita.update({
      where: { id: citaId },
      data: { estadoPago: "PENDIENTE_VALIDACION" },
    }),
  ]);

  revalidatePath("/cuenta/citas");
  return { ok: true };
}
