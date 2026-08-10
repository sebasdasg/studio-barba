import type { NextAuthConfig } from "next-auth";

// Config compatible con el Edge runtime (usada por middleware.ts): sin
// adapter ni providers que dependan de Prisma/bcrypt. La config completa
// vive en auth.ts.
export const authConfig = {
  // Necesario fuera de Vercel (ej. Netlify) — Vercel detecta su propio host
  // automáticamente, otros hosts no, y sin esto Auth.js rechaza toda
  // solicitud con un error genérico de "server configuration".
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.rol = user.rol;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.rol = token.rol;
      return session;
    },
  },
} satisfies NextAuthConfig;
