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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function actualizarCliente(
  clienteId: string,
  datos: { nombre: string; celular: string; email: string; activo: boolean }
): Promise<Resultado> {
  const admin = await requireAdmin();
  if (!admin) return { error: "No autorizado." };

  if (!datos.nombre.trim()) return { error: "Ingresa el nombre." };
  if (!/^9\d{8}$/.test(datos.celular)) {
    return { error: "Celular inválido (9 dígitos, empieza con 9)." };
  }
  if (datos.email && !EMAIL_REGEX.test(datos.email)) {
    return { error: "Ingresa un correo válido." };
  }

  const [clienteActual, celularEnUso, emailEnUso] = await Promise.all([
    prisma.user.findUnique({ where: { id: clienteId }, select: { email: true } }),
    prisma.user.findFirst({ where: { celular: datos.celular, NOT: { id: clienteId } } }),
    datos.email
      ? prisma.user.findFirst({ where: { email: datos.email, NOT: { id: clienteId } } })
      : null,
  ]);
  if (celularEnUso) return { error: "Ese celular ya lo usa otra cuenta." };
  if (emailEnUso) return { error: "Ese correo ya lo usa otra cuenta." };

  const nuevoEmail = datos.email || null;
  const cambioDeEmail = nuevoEmail !== clienteActual?.email;

  await prisma.user.update({
    where: { id: clienteId },
    data: {
      nombre: datos.nombre.trim(),
      celular: datos.celular,
      email: nuevoEmail,
      activo: datos.activo,
      // Lo ingresa un admin ya autenticado — a diferencia del registro
      // público, acá no hace falta el paso de verificación por correo.
      ...(cambioDeEmail && nuevoEmail ? { emailVerified: new Date() } : {}),
    },
  });

  revalidatePath("/admin/clientes");
  return { ok: true };
}
