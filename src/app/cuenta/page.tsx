import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";

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

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <button
          type="submit"
          className="rounded-full border border-ink-border-2 px-6 py-3 text-[13px] font-bold uppercase tracking-[1px] text-cream transition-colors hover:border-brass hover:text-brass"
        >
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}
