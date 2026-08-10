"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { calcularRefrigerio, horaAMinutos, minutosAHora } from "@/lib/reservas/horario";

type Resultado = { error: string } | { ok: true };

export function HorarioBarberoDia({
  diaSemana,
  nombreDia,
  trabajaInicial,
  horaInicioInicial,
  horaFinInicial,
  onGuardar,
}: {
  diaSemana: number;
  nombreDia: string;
  trabajaInicial: boolean;
  horaInicioInicial: string;
  horaFinInicial: string;
  onGuardar: (
    diaSemana: number,
    datos: { trabaja: boolean; horaInicio: string; horaFin: string }
  ) => Promise<Resultado>;
}) {
  const router = useRouter();
  const [trabaja, setTrabaja] = useState(trabajaInicial);
  const [horaInicio, setHoraInicio] = useState(horaInicioInicial);
  const [horaFin, setHoraFin] = useState(horaFinInicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  const refrigerio =
    trabaja && horaInicio && horaFin && horaAMinutos(horaInicio) < horaAMinutos(horaFin)
      ? calcularRefrigerio(horaAMinutos(horaInicio), horaAMinutos(horaFin))
      : null;

  async function guardar() {
    setGuardando(true);
    setError(null);
    setGuardado(false);
    const resultado = await onGuardar(diaSemana, { trabaja, horaInicio, horaFin });
    setGuardando(false);
    if ("error" in resultado) {
      setError(resultado.error);
      return;
    }
    setGuardado(true);
    router.refresh();
  }

  return (
    <div className="rounded border border-ink-border-2 px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="w-28 font-display text-lg uppercase text-cream">{nombreDia}</span>

        <label className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-cream/70">
          <input
            type="checkbox"
            checked={trabaja}
            onChange={(e) => {
              setTrabaja(e.target.checked);
              setGuardado(false);
            }}
          />
          Trabaja
        </label>

        <input
          type="time"
          step={1800}
          value={horaInicio}
          disabled={!trabaja}
          onChange={(e) => {
            setHoraInicio(e.target.value);
            setGuardado(false);
          }}
          className="rounded border border-ink-border-2 bg-ink px-2 py-1.5 text-sm text-cream outline-none focus:border-brass disabled:opacity-40"
        />
        <span className="text-cream/40">a</span>
        <input
          type="time"
          step={1800}
          value={horaFin}
          disabled={!trabaja}
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

      {refrigerio && (
        <p className="mt-2 text-xs text-cream/50">
          Refrigerio automático: {minutosAHora(refrigerio.inicio)} – {minutosAHora(refrigerio.fin)}{" "}
          (turno de 7h o más)
        </p>
      )}
    </div>
  );
}
