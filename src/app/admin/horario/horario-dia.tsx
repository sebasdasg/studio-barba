"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { guardarHorarioDia } from "./actions";

export function HorarioDia({
  diaSemana,
  nombreDia,
  abiertoInicial,
  horaInicioInicial,
  horaFinInicial,
}: {
  diaSemana: number;
  nombreDia: string;
  abiertoInicial: boolean;
  horaInicioInicial: string;
  horaFinInicial: string;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(abiertoInicial);
  const [horaInicio, setHoraInicio] = useState(horaInicioInicial);
  const [horaFin, setHoraFin] = useState(horaFinInicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  async function guardar() {
    setGuardando(true);
    setError(null);
    setGuardado(false);
    const resultado = await guardarHorarioDia(diaSemana, { abierto, horaInicio, horaFin });
    setGuardando(false);
    if ("error" in resultado) {
      setError(resultado.error);
      return;
    }
    setGuardado(true);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded border border-ink-border-2 px-4 py-3">
      <span className="w-28 font-display text-lg uppercase text-cream">{nombreDia}</span>

      <label className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-cream/70">
        <input
          type="checkbox"
          checked={abierto}
          onChange={(e) => {
            setAbierto(e.target.checked);
            setGuardado(false);
          }}
        />
        Abierto
      </label>

      <input
        type="time"
        value={horaInicio}
        disabled={!abierto}
        onChange={(e) => {
          setHoraInicio(e.target.value);
          setGuardado(false);
        }}
        className="rounded border border-ink-border-2 bg-ink px-2 py-1.5 text-sm text-cream outline-none focus:border-brass disabled:opacity-40"
      />
      <span className="text-cream/40">a</span>
      <input
        type="time"
        value={horaFin}
        disabled={!abierto}
        onChange={(e) => {
          setHoraFin(e.target.value);
          setGuardado(false);
        }}
        className="rounded border border-ink-border-2 bg-ink px-2 py-1.5 text-sm text-cream outline-none focus:border-brass disabled:opacity-40"
      />

      <button
        type="button"
        onClick={guardar}
        disabled={guardando}
        className="rounded-full border border-ink-border-2 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-cream transition-colors hover:border-brass hover:text-brass disabled:opacity-60"
      >
        {guardando ? "..." : "Guardar"}
      </button>
      {guardado && <span className="text-xs text-brass">Guardado</span>}
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
