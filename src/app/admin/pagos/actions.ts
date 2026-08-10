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

export async function validarPago(pagoId: string, aprobado: boolean): Promise<Resultado> {
  const admin = await requireAdmin();
  if (!admin) return { error: "No autorizado." };

  const pago = await prisma.pago.findUnique({ where: { id: pagoId } });
  if (!pago) return { error: "Pago no encontrado." };
  if (pago.estado !== "PENDIENTE_VALIDACION") {
    return { error: "Este pago ya fue validado." };
  }

  const nuevoEstado = aprobado ? "APROBADO" : "RECHAZADO";

  await prisma.$transaction([
    prisma.pago.update({
      where: { id: pagoId },
      data: { estado: nuevoEstado, validadoPorId: admin.id, validadoEn: new Date() },
    }),
    prisma.cita.update({
      where: { id: pago.citaId },
      data: { estadoPago: nuevoEstado },
    }),
  ]);

  revalidatePath("/admin/pagos");
  return { ok: true };
}
