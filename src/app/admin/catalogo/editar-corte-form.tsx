"use client";

import { useActionState } from "react";
import Image from "next/image";
import { actualizarCorte, type ActualizarCorteState } from "./actions";

const estadoInicial: ActualizarCorteState = {};

export function EditarCorteForm({
  corteId,
  nombreInicial,
  descripcionInicial,
  precioInicial,
  fotoUrlInicial,
  categoriaCorteIdInicial,
  activoInicial,
  categorias,
}: {
  corteId: string;
  nombreInicial: string;
  descripcionInicial: string;
  precioInicial: number;
  fotoUrlInicial: string | null;
  categoriaCorteIdInicial: string | null;
  activoInicial: boolean;
  categorias: { id: string; nombre: string }[];
}) {
  const [estado, formAction, pendiente] = useActionState(actualizarCorte, estadoInicial);

  return (
    <form action={formAction} className="rounded border border-ink-border-2 p-5">
      <input type="hidden" name="corteId" value={corteId} />

      <div className="flex gap-4">
        {fotoUrlInicial && (
          <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded border border-ink-border-2">
            <Image src={fotoUrlInicial} alt={nombreInicial} fill className="object-cover" />
          </div>
        )}
        <div className="flex-1">
          <p className="font-display text-xl uppercase text-cream">{nombreInicial}</p>
          <label className="mt-1 flex items-center gap-1.5 text-xs uppercase tracking-wide text-cream/70">
            <input type="checkbox" name="activo" defaultChecked={activoInicial} />
            Activo
          </label>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs uppercase tracking-wide text-cream/50">Nombre</label>
          <input
            name="nombre"
            defaultValue={nombreInicial}
            required
            className="mt-1 w-full rounded border border-ink-border-2 bg-transparent px-3 py-2 text-sm text-cream outline-none focus:border-brass"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-cream/50">Precio (S/)</label>
          <input
            name="precio"
            type="number"
            min={0}
            step="0.01"
            defaultValue={precioInicial}
            required
            className="mt-1 w-full rounded border border-ink-border-2 bg-transparent px-3 py-2 text-sm text-cream outline-none focus:border-brass"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs uppercase tracking-wide text-cream/50">Descripción</label>
          <textarea
            name="descripcion"
            defaultValue={descripcionInicial}
            required
            rows={2}
            className="mt-1 w-full rounded border border-ink-border-2 bg-transparent px-3 py-2 text-sm text-cream outline-none focus:border-brass"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-cream/50">Categoría</label>
          <select
            name="categoriaCorteId"
            defaultValue={categoriaCorteIdInicial ?? ""}
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
          <label className="text-xs uppercase tracking-wide text-cream/50">Reemplazar foto</label>
          <input
            name="foto"
            type="file"
            accept="image/*"
            className="mt-1 w-full text-sm text-cream/80 file:mr-3 file:rounded-full file:border file:border-ink-border-2 file:bg-transparent file:px-3 file:py-1.5 file:text-xs file:uppercase file:text-cream"
          />
        </div>
      </div>

      {estado.error && <p className="mt-3 text-sm text-red-400">{estado.error}</p>}
      {estado.ok && <p className="mt-3 text-sm text-brass">Cambios guardados.</p>}

      <button
        type="submit"
        disabled={pendiente}
        className="mt-4 rounded-full border border-ink-border-2 px-5 py-2 text-xs font-bold uppercase tracking-wide text-cream transition-colors hover:border-brass hover:text-brass disabled:opacity-60"
      >
        {pendiente ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
