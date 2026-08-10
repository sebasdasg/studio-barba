"use client";

import { useActionState } from "react";
import { crearAdmin, type CrearAdminState } from "./actions";

const estadoInicial: CrearAdminState = {};

export function NuevoAdminForm() {
  const [estado, formAction, pendiente] = useActionState(crearAdmin, estadoInicial);

  return (
    <form action={formAction} className="rounded border border-ink-border-2 p-5">
      <p className="font-display text-xl uppercase text-cream">Nuevo administrador</p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="text-xs uppercase tracking-wide text-cream/50" htmlFor="nombre">
            Nombre
          </label>
          <input
            id="nombre"
            name="nombre"
            required
            className="mt-1 w-full rounded border border-ink-border-2 bg-transparent px-3 py-2 text-sm text-cream outline-none focus:border-brass"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-cream/50" htmlFor="celular">
            Celular
          </label>
          <input
            id="celular"
            name="celular"
            inputMode="numeric"
            placeholder="9XXXXXXXX"
            required
            className="mt-1 w-full rounded border border-ink-border-2 bg-transparent px-3 py-2 text-sm text-cream outline-none focus:border-brass"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-cream/50" htmlFor="email">
            Correo
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded border border-ink-border-2 bg-transparent px-3 py-2 text-sm text-cream outline-none focus:border-brass"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-cream/50" htmlFor="password">
            Contraseña temporal
          </label>
          <input
            id="password"
            name="password"
            type="password"
            minLength={8}
            required
            className="mt-1 w-full rounded border border-ink-border-2 bg-transparent px-3 py-2 text-sm text-cream outline-none focus:border-brass"
          />
        </div>
      </div>

      {estado.error && <p className="mt-3 text-sm text-red-400">{estado.error}</p>}
      {estado.ok && <p className="mt-3 text-sm text-brass">Administrador creado.</p>}

      <button
        type="submit"
        disabled={pendiente}
        className="mt-4 rounded-full bg-brass px-6 py-2.5 text-xs font-bold uppercase tracking-wide text-ink transition-colors hover:bg-brass-hover disabled:opacity-60"
      >
        {pendiente ? "Creando..." : "Crear administrador"}
      </button>
    </form>
  );
}
