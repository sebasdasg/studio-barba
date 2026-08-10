"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export type RestablecerState = { error?: string; ok?: boolean };

export async function restablecerContrasena(
  token: string,
  _prevState: RestablecerState,
  formData: FormData
): Promise<RestablecerState> {
  const password = formData.get("password");
  if (typeof password !== "string" || password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const registro = await prisma.verificationToken.findUnique({ where: { token } });
  if (!registro || registro.expires < new Date()) {
    return { error: "Este enlace ya no es válido. Solicita uno nuevo." };
  }

  const user = await prisma.user.findUnique({ where: { email: registro.identifier } });
  if (!user) {
    return { error: "No se encontró la cuenta asociada a este enlace." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.verificationToken.delete({
      where: { identifier_token: { identifier: registro.identifier, token } },
    }),
  ]);

  return { ok: true };
}
