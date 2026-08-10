"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { actualizarCategoria } from "./actions";

export function CategoriaItem({
  categoriaId,
  nombreInicial,
  ordenInicial,
  activoInicial,
}: {
  categoriaId: string;
  nombreInicial: string;
  ordenInicial: number;
  activoInicial: boolean;
}) {
  const router = useRouter();
  const [nombre, setNombre] = useState(nombreInicial);
  const [orden, setOrden] = useState(ordenInicial);
  const [activo, setActivo] = useState(activoInicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    setGuardando(true);
    setError(null);
    const resultado = await actualizarCategoria(categoriaId, { nombre, orden, activo });
    setGuardando(false);
    if ("error" in resultado) {
      setError(resultado.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded border border-ink-border-2 px-4 py-2.5">
      <input
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        className="w-40 rounded border border-ink-border-2 bg-transparent px-2 py-1 text-sm text-cream outline-none focus:border-brass"
      />
      <label className="flex items-center gap-1.5 text-xs text-cream/60">
        Orden
        <input
          type="number"
          value={orden}
          onChange={(e) => setOrden(Number(e.target.value))}
          className="w-16 rounded border border-ink-border-2 bg-transparent px-2 py-1 text-sm text-cream outline-none focus:border-brass"
        />
      </label>
      <label className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-cream/70">
        <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
        Activa
      </label>
      <button
        type="button"
        onClick={guardar}
        disabled={guardando}
        className="rounded-full border border-ink-border-2 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-cream transition-colors hover:border-brass hover:text-brass disabled:opacity-60"
      >
        {guardando ? "..." : "Guardar"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
