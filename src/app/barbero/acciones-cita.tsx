"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  aceptarCita,
  completarServicioPresencial,
  marcarCompletada,
  marcarNoShow,
  rechazarCita,
} from "./actions";

const METODOS_PAGO = [
  { valor: "EFECTIVO", etiqueta: "Efectivo" },
  { valor: "YAPE", etiqueta: "Yape" },
  { valor: "PLIN", etiqueta: "Plin" },
] as const;

function useAccion() {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ejecutar(fn: () => Promise<{ error: string } | { ok: true }>) {
    setCargando(true);
    setError(null);
    const resultado = await fn();
    setCargando(false);
    if ("error" in resultado) {
      setError(resultado.error);
      return;
    }
    router.refresh();
  }

  return { cargando, error, ejecutar };
}

export function AccionesPendiente({ citaId }: { citaId: string }) {
  const { cargando, error, ejecutar } = useAccion();
  const [confirmandoRechazo, setConfirmandoRechazo] = useState(false);

  if (confirmandoRechazo) {
    return (
      <div className="mt-3 flex flex-col gap-2">
        <p className="text-xs text-cream/70">¿Rechazar esta cita? Se ofrecerá a otro barbero.</p>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setConfirmandoRechazo(false)}
            disabled={cargando}
            className="text-xs uppercase tracking-wide text-cream/50 hover:text-cream"
          >
            Volver
          </button>
          <button
            type="button"
            onClick={() => ejecutar(() => rechazarCita(citaId))}
            disabled={cargando}
            className="text-xs font-bold uppercase tracking-wide text-red-400 hover:text-red-300"
          >
            {cargando ? "Rechazando..." : "Sí, rechazar"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 flex gap-3">
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        type="button"
        onClick={() => ejecutar(() => aceptarCita(citaId))}
        disabled={cargando}
        className="rounded-full bg-brass px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink transition-colors hover:bg-brass-hover disabled:opacity-60"
      >
        {cargando ? "..." : "Aceptar"}
      </button>
      <button
        type="button"
        onClick={() => setConfirmandoRechazo(true)}
        disabled={cargando}
        className="rounded-full border border-ink-border-2 px-4 py-2 text-xs font-bold uppercase tracking-wide text-cream hover:border-red-400 hover:text-red-400"
      >
        Rechazar
      </button>
    </div>
  );
}

export function AccionesConfirmada({
  citaId,
  esPresencial,
}: {
  citaId: string;
  esPresencial: boolean;
}) {
  const { cargando, error, ejecutar } = useAccion();
  const [eligiendoPago, setEligiendoPago] = useState(false);

  if (esPresencial) {
    if (eligiendoPago) {
      return (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-cream/60">Método de pago:</span>
          {error && <p className="w-full text-xs text-red-400">{error}</p>}
          {METODOS_PAGO.map((m) => (
            <button
              key={m.valor}
              type="button"
              disabled={cargando}
              onClick={() => ejecutar(() => completarServicioPresencial(citaId, m.valor))}
              className="rounded-full bg-brass px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink transition-colors hover:bg-brass-hover disabled:opacity-60"
            >
              {cargando ? "..." : m.etiqueta}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setEligiendoPago(false)}
            disabled={cargando}
            className="text-xs text-cream/50 hover:text-cream"
          >
            Cancelar
          </button>
        </div>
      );
    }
    return (
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setEligiendoPago(true)}
          className="rounded-full bg-brass px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink transition-colors hover:bg-brass-hover"
        >
          Servicio terminado
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3 flex gap-3">
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        type="button"
        onClick={() => ejecutar(() => marcarCompletada(citaId))}
        disabled={cargando}
        className="rounded-full bg-brass px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink transition-colors hover:bg-brass-hover disabled:opacity-60"
      >
        {cargando ? "..." : "Servicio terminado"}
      </button>
      <button
        type="button"
        onClick={() => ejecutar(() => marcarNoShow(citaId))}
        disabled={cargando}
        className="rounded-full border border-ink-border-2 px-4 py-2 text-xs font-bold uppercase tracking-wide text-cream hover:border-red-400 hover:text-red-400"
      >
        Cliente no llegó
      </button>
    </div>
  );
}
