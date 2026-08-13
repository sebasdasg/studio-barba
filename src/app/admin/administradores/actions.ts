"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.rol !== "ADMIN") return null;
  return session.user;
}

export type CrearAdminState = { error?: string; ok?: boolean };

export async function crearAdmin(
  _prevState: CrearAdminState,
  formData: FormData
): Promise<CrearAdminState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "No autorizado." };

  const nombre = formData.get("nombre");
  const celular = formData.get("celular");
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof nombre !== "string" || !nombre.trim()) {
    return { error: "Ingresa el nombre." };
  }
  if (typeof celular !== "string" || !/^9\d{8}$/.test(celular)) {
    return { error: "Celular inválido (9 dígitos, empieza con 9)." };
  }
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Ingresa un correo válido." };
  }
  if (typeof password !== "string" || password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const [existenteCelular, existenteEmail] = await Promise.all([
    prisma.user.findUnique({ where: { celular } }),
    prisma.user.findUnique({ where: { email } }),
  ]);
  if (existenteCelular) return { error: "Ya existe una cuenta con ese celular." };
  if (existenteEmail) return { error: "Ya existe una cuenta con ese correo." };

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    // Lo crea un admin ya autenticado, no el registro público — el correo
    // no necesita el paso de verificación.
    data: { nombre: nombre.trim(), celular, email, passwordHash, rol: "ADMIN", emailVerified: new Date() },
  });

  revalidatePath("/admin/administradores");
  return { ok: true };
}
