"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { actualizarBarbero } from "./actions";

export function EditarBarberoForm({
  barberoId,
  nombre,
  celular,
  comisionInicial,
  activoInicial,
  cortes,
  corteIdsInicial,
}: {
  barberoId: string;
  nombre: string;
  celular: string | null;
  comisionInicial: number;
  activoInicial: boolean;
  cortes: { id: string; nombre: string }[];
  corteIdsInicial: string[];
}) {
  const router = useRouter();
  const [comision, setComision] = useState(comisionInicial);
  const [activo, setActivo] = useState(activoInicial);
  const [corteIds, setCorteIds] = useState<string[]>(corteIdsInicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  function alternarCorte(id: string) {
    setGuardado(false);
    setCorteIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function guardar() {
    setGuardando(true);
    setError(null);
    setGuardado(false);
    const resultado = await actualizarBarbero(barberoId, {
      comisionPorcentaje: comision,
      activo,
      corteIds,
    });
    setGuardando(false);
    if ("error" in resultado) {
      setError(resultado.error);
      return;
    }
    setGuardado(true);
    router.refresh();
  }

  return (
    <div className="rounded border border-ink-border-2 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-xl uppercase text-cream">{nombre}</p>
          <p className="mt-1 text-sm text-cream/60">{celular}</p>
        </div>
        <label className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-cream/70">
          <input
            type="checkbox"
            checked={activo}
            onChange={(e) => {
              setActivo(e.target.checked);
              setGuardado(false);
            }}
          />
          Activo
        </label>
      </div>

      <div className="mt-3">
        <label className="text-xs uppercase tracking-wide text-cream/50">Comisión (%)</label>
        <input
          type="number"
          min={0}
          max={100}
          step="0.01"
          value={comision}
          onChange={(e) => {
            setComision(Number(e.target.value));
            setGuardado(false);
          }}
          className="mt-1 block w-28 rounded border border-ink-border-2 bg-transparent px-3 py-1.5 text-sm text-cream outline-none focus:border-brass"
        />
      </div>

      <p className="mt-3 text-xs uppercase tracking-wide text-cream/50">Cortes que realiza</p>
      <div className="mt-2 flex flex-wrap gap-3">
        {cortes.map((c) => (
          <label key={c.id} className="flex items-center gap-1.5 text-sm text-cream/80">
            <input
              type="checkbox"
              checked={corteIds.includes(c.id)}
              onChange={() => alternarCorte(c.id)}
            />
            {c.nombre}
          </label>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      {guardado && <p className="mt-3 text-sm text-brass">Cambios guardados.</p>}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={guardar}
          disabled={guardando}
          className="rounded-full border border-ink-border-2 px-5 py-2 text-xs font-bold uppercase tracking-wide text-cream transition-colors hover:border-brass hover:text-brass disabled:opacity-60"
        >
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>
        <Link
          href={`/admin/barberos/${barberoId}/horario`}
          className="rounded-full border border-ink-border-2 px-5 py-2 text-xs font-bold uppercase tracking-wide text-cream transition-colors hover:border-brass hover:text-brass"
        >
          Editar horario
        </Link>
      </div>
    </div>
  );
}
