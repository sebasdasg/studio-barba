"use client";

import { use, useActionState } from "react";
import Link from "next/link";
import { restablecerContrasena, type RestablecerState } from "./actions";

const estadoInicial: RestablecerState = {};

export default function RestablecerPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const accionConToken = restablecerContrasena.bind(null, token);
  const [estado, formAction, pendiente] = useActionState(accionConToken, estadoInicial);

  if (estado.ok) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink px-6 py-16">
        <div className="w-full max-w-sm text-center">
          <h1 className="font-display text-4xl uppercase text-cream">Contraseña actualizada</h1>
          <p className="mt-3 text-sm text-cream/60">Ya puedes iniciar sesión con tu nueva contraseña.</p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-full bg-brass px-6 py-3 text-[13px] font-bold uppercase tracking-[1px] text-ink transition-colors hover:bg-brass-hover"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-center font-display text-4xl uppercase text-cream">
          Elige una nueva contraseña
        </h1>

        <form action={formAction} className="mt-8 flex flex-col gap-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-cream/60" htmlFor="password">
              Nueva contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              minLength={8}
              required
              className="mt-1.5 w-full rounded border border-ink-border-2 bg-transparent px-4 py-3 text-cream outline-none focus:border-brass"
            />
          </div>

          {estado.error && <p className="text-sm text-red-400">{estado.error}</p>}

          <button
            type="submit"
            disabled={pendiente}
            className="mt-2 rounded-full bg-brass px-6 py-3 text-[13px] font-bold uppercase tracking-[1px] text-ink transition-colors hover:bg-brass-hover disabled:opacity-60"
          >
            {pendiente ? "Guardando..." : "Guardar nueva contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}
