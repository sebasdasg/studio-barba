"use server";

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";

export type RecuperarState = { mensaje?: string; error?: string };

const MENSAJE_GENERICO: RecuperarState = {
  mensaje:
    "Si existe una cuenta con esos datos y tiene un correo registrado, te enviamos un enlace para restablecer tu contraseña.",
};

export async function solicitarRecuperacion(
  _prevState: RecuperarState,
  formData: FormData
): Promise<RecuperarState> {
  const valor = formData.get("celularOEmail");
  if (typeof valor !== "string" || !valor.trim()) {
    return { error: "Ingresa tu celular o correo." };
  }
  const busqueda = valor.trim();

  const user = await prisma.user.findFirst({
    where: { OR: [{ celular: busqueda }, { email: busqueda }] },
  });

  // Respuesta genérica siempre exista o no la cuenta — evita revelar qué
  // celulares/correos están registrados en el sistema.
  if (!user || !user.email) return MENSAJE_GENERICO;

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.verificationToken.create({
    data: { identifier: user.email, token, expires },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const url = `${baseUrl}/restablecer/${token}`;

  try {
    await resend.emails.send({
      from: "Studio Barba <onboarding@resend.dev>",
      to: user.email,
      subject: "Restablece tu contraseña — Studio Barba",
      html: `<p>Hola ${user.nombre},</p><p>Haz clic en el siguiente enlace para elegir una nueva contraseña. El enlace expira en 1 hora.</p><p><a href="${url}">${url}</a></p><p>Si no solicitaste esto, ignora este correo.</p>`,
    });
  } catch (err) {
    console.error("Error enviando correo de recuperación:", err);
  }

  return MENSAJE_GENERICO;
}
