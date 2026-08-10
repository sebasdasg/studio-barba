"use client";

import { useActionState } from "react";
import { crearCorte, type CrearCorteState } from "./actions";

const estadoInicial: CrearCorteState = {};

export function NuevoCorteForm({
  categorias,
}: {
  categorias: { id: string; nombre: string }[];
}) {
  const [estado, formAction, pendiente] = useActionState(crearCorte, estadoInicial);

  return (
    <form action={formAction} className="rounded border border-ink-border-2 p-5">
      <p className="font-display text-xl uppercase text-cream">Nuevo corte</p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          <label className="text-xs uppercase tracking-wide text-cream/50" htmlFor="precio">
            Precio (S/)
          </label>
          <input
            id="precio"
            name="precio"
            type="number"
            min={0}
            step="0.01"
            required
            className="mt-1 w-full rounded border border-ink-border-2 bg-transparent px-3 py-2 text-sm text-cream outline-none focus:border-brass"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs uppercase tracking-wide text-cream/50" htmlFor="descripcion">
            Descripción
          </label>
          <textarea
            id="descripcion"
            name="descripcion"
            required
            rows={2}
            className="mt-1 w-full rounded border border-ink-border-2 bg-transparent px-3 py-2 text-sm text-cream outline-none focus:border-brass"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-cream/50" htmlFor="categoriaCorteId">
            Categoría
          </label>
          <select
            id="categoriaCorteId"
            name="categoriaCorteId"
            defaultValue=""
            className="mt-1 w-full rounded border border-ink-border-2 bg-ink px-3 py-2 text-sm text-cream outline-none focus:border-brass"
          >
            <option value="">Sin categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-cream/50" htmlFor="foto">
            Foto
          </label>
          <input
            id="foto"
            name="foto"
            type="file"
            accept="image/*"
            className="mt-1 w-full text-sm text-cream/80 file:mr-3 file:rounded-full file:border file:border-ink-border-2 file:bg-transparent file:px-3 file:py-1.5 file:text-xs file:uppercase file:text-cream"
          />
        </div>
      </div>

      {estado.error && <p className="mt-3 text-sm text-red-400">{estado.error}</p>}
      {estado.ok && <p className="mt-3 text-sm text-brass">Corte creado.</p>}

      <button
        type="submit"
        disabled={pendiente}
        className="mt-4 rounded-full bg-brass px-6 py-2.5 text-xs font-bold uppercase tracking-wide text-ink transition-colors hover:bg-brass-hover disabled:opacity-60"
      >
        {pendiente ? "Creando..." : "Crear corte"}
      </button>
    </form>
  );
}
