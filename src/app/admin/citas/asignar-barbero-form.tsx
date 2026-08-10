"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { asignarBarberoManualmente } from "./actions";

export function AsignarBarberoForm({
  citaId,
  barberos,
}: {
  citaId: string;
  barberos: { id: string; nombre: string }[];
}) {
  const router = useRouter();
  const [barberoId, setBarberoId] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function asignar() {
    if (!barberoId) return;
    setCargando(true);
    setError(null);
    const resultado = await asignarBarberoManualmente(citaId, barberoId);
    setCargando(false);
    if ("error" in resultado) {
      setError(resultado.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <select
        value={barberoId}
        onChange={(e) => setBarberoId(e.target.value)}
        className="rounded border border-ink-border-2 bg-ink px-3 py-2 text-sm text-cream outline-none focus:border-brass"
      >
        <option value="">Elige un barbero</option>
        {barberos.map((b) => (
          <option key={b.id} value={b.id}>
            {b.nombre}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={asignar}
        disabled={!barberoId || cargando}
        className="rounded-full bg-brass px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink transition-colors hover:bg-brass-hover disabled:opacity-60"
      >
        {cargando ? "Asignando..." : "Asignar"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
