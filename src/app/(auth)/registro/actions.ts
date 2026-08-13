"use server";

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { registroSchema } from "@/lib/validations/auth";

export type RegistroState = {
  error?: string;
  ok?: boolean;
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

  // Bloqueamos el ingreso hasta que confirme el correo — evita que alguien
  // se registre usando el correo de otra persona sin su consentimiento.
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.verificationToken.create({ data: { identifier: email, token, expires } });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const url = `${baseUrl}/verificar/${token}`;

  try {
    await resend.emails.send({
      from: "Studio Barba <onboarding@resend.dev>",
      to: email,
      subject: "Confirma tu cuenta — Studio Barba",
      html: `<p>Hola ${nombre},</p><p>Alguien creó una cuenta en Studio Barba con este correo. Si fuiste tú, haz clic en el siguiente enlace para confirmarla y poder iniciar sesión. El enlace expira en 24 horas.</p><p><a href="${url}">${url}</a></p><p>Si no creaste esta cuenta, ignora este correo.</p>`,
    });
  } catch (err) {
    console.error("Error enviando correo de verificación:", err);
  }

  return { ok: true };
}
