import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CerrarSesionBoton } from "@/components/cerrar-sesion-boton";

// Todo el panel de admin depende de sesión — ver nota en
// src/app/reservar/page.tsx. Puesto en el layout, cubre cada página hija.
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.rol !== "ADMIN") redirect("/cuenta");

  return (
    <div>
      <div className="flex justify-end bg-ink px-6 pt-6 sm:px-[6vw]">
        <CerrarSesionBoton className="text-sm text-cream/60 transition-colors hover:text-brass" />
      </div>
      {children}
    </div>
  );
}
