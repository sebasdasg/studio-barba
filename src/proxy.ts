import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  if (!req.auth) {
    return Response.redirect(new URL("/login", req.url));
  }

  const { pathname } = req.nextUrl;
  const rol = req.auth.user.rol;

  if (pathname.startsWith("/barbero") && rol !== "BARBERO") {
    return Response.redirect(new URL("/cuenta", req.url));
  }
  if (pathname.startsWith("/admin") && rol !== "ADMIN") {
    return Response.redirect(new URL("/cuenta", req.url));
  }
});

export const config = {
  matcher: ["/cuenta/:path*", "/reservar/:path*", "/barbero/:path*", "/admin/:path*"],
};
