import NextAuth, { CredentialsSignin } from "next-auth";
import type { Adapter, AdapterUser } from "next-auth/adapters";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

class CorreoNoVerificadoError extends CredentialsSignin {
  code = "correo_no_verificado";
}

// El modelo User usa "nombre", no el "name" estándar que PrismaAdapter
// asume (viene de perfiles OAuth como Google). Sin esta traducción,
// createUser/updateUser fallan con un campo desconocido en Prisma — Auth.js
// oculta ese error real detrás de un genérico "Configuration".
function conNombreComoName(user: unknown): AdapterUser | null {
  if (!user) return null;
  const u = user as AdapterUser & { nombre: string };
  return { ...u, name: u.nombre };
}

function buildAdapter(): Adapter {
  const base = PrismaAdapter(prisma);
  return {
    ...base,
    async getUser(id) {
      return conNombreComoName(await base.getUser!(id));
    },
    async getUserByEmail(email) {
      return conNombreComoName(await base.getUserByEmail!(email));
    },
    async getUserByAccount(account) {
      return conNombreComoName(await base.getUserByAccount!(account));
    },
    async createUser({ id: _id, name, ...data }) {
      // Un proveedor OAuth (Google) ya probó que el usuario controla ese
      // correo al iniciar sesión con él — a diferencia del registro manual,
      // acá no hace falta el paso extra de verificación por correo.
      const creado = await prisma.user.create({
        data: { ...data, nombre: name?.trim() || "Cliente", emailVerified: new Date() },
      });
      return conNombreComoName(creado)!;
    },
    async updateUser({ id, name, ...data }) {
      const cambios: Record<string, unknown> = { ...data };
      if (typeof name === "string" && name.trim()) cambios.nombre = name;
      const actualizado = await prisma.user.update({ where: { id: id! }, data: cambios });
      return conNombreComoName(actualizado)!;
    },
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: buildAdapter(),
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

        // Cuentas sin correo (demo/legado, de antes de exigirlo en el
        // registro) no pueden verificar nada — no las bloqueamos.
        if (user.email && !user.emailVerified) throw new CorreoNoVerificadoError();

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
