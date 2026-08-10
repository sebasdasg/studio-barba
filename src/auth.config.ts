import type { NextAuthConfig } from "next-auth";

// Config compatible con el Edge runtime (usada por middleware.ts): sin
// adapter ni providers que dependan de Prisma/bcrypt. La config completa
// vive en auth.ts.
export const authConfig = {
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
