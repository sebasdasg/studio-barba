"use server";

import { prisma } from "@/lib/prisma";

export type VerificarState = { error?: string; ok?: boolean };

export async function verificarCorreo(
  token: string,
  _prevState: VerificarState
): Promise<VerificarState> {
  const registro = await prisma.verificationToken.findUnique({ where: { token } });
  if (!registro || registro.expires < new Date()) {
    return { error: "Este enlace ya no es válido. Vuelve a registrarte para recibir uno nuevo." };
  }

  const user = await prisma.user.findUnique({ where: { email: registro.identifier } });
  if (!user) {
    return { error: "No se encontró la cuenta asociada a este enlace." };
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } }),
    prisma.verificationToken.delete({
      where: { identifier_token: { identifier: registro.identifier, token } },
    }),
  ]);

  return { ok: true };
}
