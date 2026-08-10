"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";
import { registroSchema } from "@/lib/validations/auth";

export type RegistroState = {
  error?: string;
};

export async function registrarCliente(
  _prevState: RegistroState,
  formData: FormData
): Promise<RegistroState> {
  const parsed = registroSchema.safeParse({
    nombre: formData.get("nombre"),
    celular: formData.get("celular"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { nombre, celular, email, password } = parsed.data;

  const [existenteCelular, existenteEmail] = await Promise.all([
    prisma.user.findUnique({ where: { celular } }),
    prisma.user.findUnique({ where: { email } }),
  ]);
  if (existenteCelular) {
    return { error: "Ya existe una cuenta con ese celular." };
  }
  if (existenteEmail) {
    return { error: "Ya existe una cuenta con ese correo." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: { nombre, celular, email, passwordHash, rol: "CLIENTE" },
  });

  // signIn con redirectTo lanza un redirect internamente (comportamiento
  // normal de Next.js) — no hace falta manejar el retorno.
  await signIn("credentials", { celular, password, redirectTo: "/cuenta" });

  return {};
}
