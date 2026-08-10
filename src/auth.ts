import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Google,
    Credentials({
      credentials: {
        celular: { label: "Celular", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (credentials) => {
        const celular = credentials?.celular as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!celular || !password) return null;

        const user = await prisma.user.findUnique({ where: { celular } });
        if (!user?.passwordHash) return null;
        if (!user.activo) return null;

        const esValido = await bcrypt.compare(password, user.passwordHash);
        if (!esValido) return null;

        return {
          id: user.id,
          name: user.nombre,
          email: user.email,
          rol: user.rol,
        };
      },
    }),
  ],
});
