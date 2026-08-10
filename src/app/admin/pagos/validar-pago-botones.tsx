"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { validarPago } from "./actions";

export function ValidarPagoBotones({ pagoId }: { pagoId: string }) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accionar(aprobado: boolean) {
    setCargando(true);
    setError(null);
    const resultado = await validarPago(pagoId, aprobado);
    setCargando(false);
    if ("error" in resultado) {
      setError(resultado.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        type="button"
        onClick={() => accionar(true)}
        disabled={cargando}
        className="rounded-full bg-brass px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink transition-colors hover:bg-brass-hover disabled:opacity-60"
      >
        {cargando ? "..." : "Aprobar"}
      </button>
      <button
        type="button"
        onClick={() => accionar(false)}
        disabled={cargando}
        className="rounded-full border border-red-400/50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-red-400 transition-colors hover:border-red-300 hover:text-red-300"
      >
        Rechazar
      </button>
    </div>
  );
}
