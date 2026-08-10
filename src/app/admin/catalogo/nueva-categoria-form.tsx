"use client";

import { useActionState } from "react";
import { crearCategoria, type CrearCategoriaState } from "./actions";

const estadoInicial: CrearCategoriaState = {};

export function NuevaCategoriaForm() {
  const [estado, formAction, pendiente] = useActionState(crearCategoria, estadoInicial);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="text-xs uppercase tracking-wide text-cream/50" htmlFor="nombreCategoria">
          Nueva categoría
        </label>
        <input
          id="nombreCategoria"
          name="nombre"
          placeholder="Ej. Pelo largo"
          required
          className="mt-1 block w-56 rounded border border-ink-border-2 bg-transparent px-3 py-2 text-sm text-cream outline-none focus:border-brass"
        />
      </div>
      <button
        type="submit"
        disabled={pendiente}
        className="rounded-full border border-ink-border-2 px-5 py-2 text-xs font-bold uppercase tracking-wide text-cream transition-colors hover:border-brass hover:text-brass disabled:opacity-60"
      >
        {pendiente ? "Creando..." : "Agregar"}
      </button>
      {estado.error && <p className="text-sm text-red-400">{estado.error}</p>}
    </form>
  );
}
