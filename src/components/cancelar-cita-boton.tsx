"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelarCitaAction, evaluarCancelacionAction } from "@/app/reservar/actions";

export function CancelarCitaBoton({ citaId }: { citaId: string }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [penalidad, setPenalidad] = useState<{ penalidadAplica: boolean; montoPenalidad: number } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  async function iniciar() {
    setError(null);
    const resultado = await evaluarCancelacionAction(citaId);
    if ("error" in resultado) {
      setError(resultado.error);
      return;
    }
    setPenalidad(resultado);
    setConfirmando(true);
  }

  async function confirmar() {
    setProcesando(true);
    const resultado = await cancelarCitaAction(citaId);
    setProcesando(false);
    if ("error" in resultado) {
      setError(resultado.error);
      return;
    }
    setConfirmando(false);
    router.refresh();
  }

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={iniciar}
        className="text-xs font-bold uppercase tracking-wide text-red-400 hover:text-red-300"
      >
        Cancelar cita
      </button>
    );
  }

  return (
    <div className="mt-3 border-t border-ink-border pt-3 text-left">
      {penalidad?.penalidadAplica ? (
        <p className="text-xs text-cream/70">
          Está a menos de 1 hora — se aplicará una penalidad de{" "}
          <strong className="text-brass">S/ {penalidad.montoPenalidad}</strong>.
        </p>
      ) : (
        <p className="text-xs text-cream/70">¿Cancelar esta cita? No se aplica penalidad.</p>
      )}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          disabled={procesando}
          className="text-xs uppercase tracking-wide text-cream/50 hover:text-cream"
        >
          Volver
        </button>
        <button
          type="button"
          onClick={confirmar}
          disabled={procesando}
          className="text-xs font-bold uppercase tracking-wide text-red-400 hover:text-red-300"
        >
          {procesando ? "Cancelando..." : "Sí, cancelar"}
        </button>
      </div>
    </div>
  );
}
