"use client";

import { signOut } from "next-auth/react";

// Server Action + redirectTo perdía el Set-Cookie que invalida la sesión en
// Netlify (el POST a /api/auth/signout envuelto en un Server Action con
// redirect no propagaba el header). Este botón hace el signOut como un
// fetch normal del lado del cliente, que sí respeta el Set-Cookie.
export function CerrarSesionBoton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={() => signOut({ callbackUrl: "/" })} className={className}>
      Cerrar sesión
    </button>
  );
}
