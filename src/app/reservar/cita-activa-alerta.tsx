"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { cancelarCitaAction, evaluarCancelacionAction } from "./actions";

type CitaActiva = {
  id: string;
  corteNombre: string;
  barberoNombre: string;
  fecha: string; // "YYYY-MM-DD"
  horaInicio: string;
  estado: string;
};

type Paso = "inicial" | "confirmando" | "procesando";

export function CitaActivaAlerta({ cita }: { cita: CitaActiva }) {
  const router = useRouter();
  const [paso, setPaso] = useState<Paso>("inicial");
  const [intencion, setIntencion] = useState<"actualizar" | "cancelar" | null>(null);
  const [penalidad, setPenalidad] = useState<{ penalidadAplica: boolean; montoPenalidad: number } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const fechaFormateada = new Date(`${cita.fecha}T00:00:00Z`).toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

  async function iniciar(accion: "actualizar" | "cancelar") {
    setError(null);
    setIntencion(accion);
    const resultado = await evaluarCancelacionAction(cita.id);
    if ("error" in resultado) {
      setError(resultado.error);
      return;
    }
    setPenalidad(resultado);
    setPaso("confirmando");
  }

  async function confirmar() {
    if (!intencion) return;
    setPaso("procesando");
    const resultado = await cancelarCitaAction(cita.id);
    if ("error" in resultado) {
      setError(resultado.error);
      setPaso("confirmando");
      return;
    }
    router.push(intencion === "actualizar" ? "/reservar" : "/cuenta/citas");
    router.refresh();
  }

  return (
    <div className="w-full max-w-md rounded border border-ink-border-2 px-6 py-8 text-center">
      <p className="text-xs uppercase tracking-widest text-brass">Ya tienes una cita activa</p>
      <h1 className="mt-3 font-display text-2xl uppercase text-cream">{cita.corteNombre}</h1>
      <p className="mt-2 text-sm text-cream/70">
        {fechaFormateada} · {cita.horaInicio}
      </p>
      <p className="mt-1 text-sm text-cream/70">Barbero: {cita.barberoNombre}</p>

      <p className="mt-5 text-sm text-cream/60">
        No puedes reservar una cita nueva mientras tengas esta activa. Puedes actualizarla
        (cambiar corte, barbero u horario) o cancelarla.
      </p>

      {paso === "inicial" && (
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => iniciar("actualizar")}
            className="rounded-full bg-brass px-6 py-3 text-[13px] font-bold uppercase tracking-[1px] text-ink transition-colors hover:bg-brass-hover"
          >
            Actualizar reserva
          </button>
          <button
            type="button"
            onClick={() => iniciar("cancelar")}
            className="rounded-full border border-red-400/50 px-6 py-3 text-[13px] font-bold uppercase tracking-[1px] text-red-400 transition-colors hover:border-red-300 hover:text-red-300"
          >
            Cancelar reserva
          </button>
          <Link href="/cuenta/citas" className="mt-1 text-sm text-cream/50 hover:text-brass">
            Ver mis citas
          </Link>
        </div>
      )}

      {(paso === "confirmando" || paso === "procesando") && (
        <div className="mt-6">
          {penalidad?.penalidadAplica && (
            <p className="rounded border border-ink-border-2 px-4 py-3 text-sm text-cream/80">
              Esta cita está a menos de 1 hora — se aplicará una penalidad de{" "}
              <strong className="text-brass">S/ {penalidad.montoPenalidad}</strong>, que se
              cobrará en tu próxima cita.
            </p>
          )}
          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setPaso("inicial")}
              disabled={paso === "procesando"}
              className="rounded-full border border-ink-border-2 px-6 py-3 text-[13px] font-bold uppercase tracking-[1px] text-cream disabled:opacity-50"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={confirmar}
              disabled={paso === "procesando"}
              className={cn(
                "flex-1 rounded-full px-6 py-3 text-[13px] font-bold uppercase tracking-[1px] transition-colors disabled:opacity-60",
                intencion === "actualizar"
                  ? "bg-brass text-ink hover:bg-brass-hover"
                  : "border border-red-400/50 text-red-400 hover:border-red-300 hover:text-red-300"
              )}
            >
              {paso === "procesando"
                ? "Procesando..."
                : intencion === "actualizar"
                  ? "Sí, cancelar y reservar de nuevo"
                  : "Sí, cancelar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
