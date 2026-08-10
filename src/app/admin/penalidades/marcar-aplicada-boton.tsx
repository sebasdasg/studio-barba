"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { marcarPenalidadAplicada } from "./actions";

export function MarcarAplicadaBoton({ penalidadId }: { penalidadId: string }) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function marcar() {
    setCargando(true);
    setError(null);
    const resultado = await marcarPenalidadAplicada(penalidadId);
    setCargando(false);
    if ("error" in resultado) {
      setError(resultado.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={marcar}
        disabled={cargando}
        className="rounded-full border border-ink-border-2 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-cream transition-colors hover:border-brass hover:text-brass disabled:opacity-60"
      >
        {cargando ? "..." : "Marcar como cobrada"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
