import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CerrarSesionBoton } from "@/components/cerrar-sesion-boton";

// Depende de la sesión de quien visita — ver nota en src/app/reservar/page.tsx.
export const dynamic = "force-dynamic";

export default async function CuentaPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Cada rol tiene su propia pantalla principal — /cuenta no aporta nada
  // que no repita esa pantalla, así que no se queda como parada intermedia.
  if (session.user.rol === "BARBERO") redirect("/barbero");
  if (session.user.rol === "CLIENTE") redirect("/cuenta/citas");
  if (session.user.rol === "ADMIN") redirect("/admin");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ink px-6 text-center">
      <div>
        <p className="text-xs uppercase tracking-widest text-brass">Sesión iniciada</p>
        <h1 className="mt-2 font-display text-4xl uppercase text-cream">
          Hola, {session.user.name}
        </h1>
      </div>

      <CerrarSesionBoton className="rounded-full border border-ink-border-2 px-6 py-3 text-[13px] font-bold uppercase tracking-[1px] text-cream transition-colors hover:border-brass hover:text-brass" />
    </div>
  );
}
