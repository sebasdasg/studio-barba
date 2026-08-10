import type { DefaultSession } from "next-auth";
import type { Rol } from "@prisma/client";

declare module "@auth/core/types" {
  interface Session {
    user: {
      id: string;
      rol: Rol;
    } & DefaultSession["user"];
  }

  interface User {
    rol: Rol;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    rol: Rol;
  }
}
