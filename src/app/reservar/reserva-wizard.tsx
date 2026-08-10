"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { PhotoBox } from "@/components/landing/photo-box";
import {
  confirmarReserva,
  obtenerBarberosDeCorte,
  obtenerSlots,
} from "./actions";
import type { SlotDisponibilidad } from "@/lib/reservas/disponibilidad";

type Corte = {
  id: string;
  nombre: string;
  precio: number;
  descripcion: string;
  fotoUrl: string | null;
};
type AdicionalItem = { id: string; nombre: string; precio: number };
type Barbero = { id: string; nombre: string };

const AUTO = "auto" as const;
type Opcion = string | typeof AUTO | null;

type Paso = "corte" | "barbero" | "backup" | "horario" | "adicionales" | "resumen";
const PASOS: { id: Paso; label: string }[] = [
  { id: "corte", label: "Corte" },
  { id: "barbero", label: "Barbero" },
  { id: "backup", label: "Respaldo" },
  { id: "horario", label: "Fecha y hora" },
  { id: "adicionales", label: "Adicionales" },
  { id: "resumen", label: "Resumen" },
];

// Mismo criterio que el servidor: "hoy" es la fecha en la zona horaria del
// negocio (Lima), no la del navegador del cliente.
function hoyISO() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(new Date());
}

export function ReservaWizard({
  cortes,
  adicionales,
}: {
  cortes: Corte[];
  adicionales: AdicionalItem[];
}) {
  const router = useRouter();
  const [paso, setPaso] = useState<Paso>("corte");

  const [corteId, setCorteId] = useState<string | null>(null);
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [primeraOpcion, setPrimeraOpcion] = useState<Opcion>(null);
  const [segundaOpcion, setSegundaOpcion] = useState<Opcion>(null);

  const [fecha, setFecha] = useState(hoyISO());
  const [slots, setSlots] = useState<SlotDisponibilidad[]>([]);
  const [horaInicio, setHoraInicio] = useState<string | null>(null);

  const [adicionalesIds, setAdicionalesIds] = useState<string[]>([]);
  const [corteAmpliado, setCorteAmpliado] = useState<Corte | null>(null);

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const corte = cortes.find((c) => c.id === corteId) ?? null;

  useEffect(() => {
    if (!corteId) return;
    obtenerBarberosDeCorte(corteId).then(setBarberos);
  }, [corteId]);

  useEffect(() => {
    if (!corteId || paso !== "horario") return;
    let cancelado = false;
    obtenerSlots({
      corteId,
      fecha,
      barberoId: primeraOpcion && primeraOpcion !== AUTO ? primeraOpcion : undefined,
    }).then((resultado) => {
      if (cancelado) return;
      setSlots(resultado);
      setHoraInicio(null);
    });
    return () => {
      cancelado = true;
    };
  }, [corteId, fecha, primeraOpcion, paso]);

  const totalAdicionales = useMemo(
    () =>
      adicionales
        .filter((a) => adicionalesIds.includes(a.id))
        .reduce((suma, a) => suma + a.precio, 0),
    [adicionales, adicionalesIds]
  );
  const total = (corte?.precio ?? 0) + totalAdicionales;

  function nombreBarbero(opcion: Opcion) {
    if (opcion === AUTO || opcion === null) return "Asignación automática";
    return barberos.find((b) => b.id === opcion)?.nombre ?? "—";
  }

  function irA(destino: Paso) {
    setError(null);
    setPaso(destino);
  }

  function elegirCorte(c: Corte) {
    setCorteId(c.id);
    setPrimeraOpcion(null);
    setSegundaOpcion(null);
    setCorteAmpliado(null);
    irA("barbero");
  }

  async function onConfirmar() {
    if (!corteId || !horaInicio) return;
    setEnviando(true);
    setError(null);

    const resultado = await confirmarReserva({
      corteId,
      barberoId: primeraOpcion === AUTO ? null : primeraOpcion,
      barberoSegundaOpcionId: segundaOpcion === AUTO ? null : segundaOpcion,
      fecha,
      horaInicio,
      adicionalesIds,
    });

    setEnviando(false);

    if ("error" in resultado) {
      setError(resultado.error);
      return;
    }

    router.push(`/reservar/confirmacion/${resultado.citaId}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <ol className="mb-10 flex flex-wrap gap-x-6 gap-y-2 text-xs uppercase tracking-wide">
        {PASOS.map((p, i) => (
          <li
            key={p.id}
            className={cn(
              "flex items-center gap-1.5",
              p.id === paso ? "text-brass" : "text-cream/40"
            )}
          >
            <span>{i + 1}.</span>
            {p.label}
          </li>
        ))}
      </ol>

      {paso === "corte" && (
        <section>
          <h2 className="font-display text-3xl uppercase text-cream">Elige tu corte</h2>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {cortes.map((c) => (
              <div
                key={c.id}
                className={cn(
                  "overflow-hidden rounded border transition-colors",
                  corteId === c.id
                    ? "border-brass bg-brass/10"
                    : "border-ink-border-2 hover:border-brass"
                )}
              >
                <button
                  type="button"
                  onClick={() => setCorteAmpliado(c)}
                  className="group relative block w-full"
                >
                  <PhotoBox
                    src={c.fotoUrl ?? undefined}
                    alt={c.nombre}
                    label={`Foto pendiente: ${c.nombre}`}
                    aspect="4/5"
                    imgClassName="transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className="absolute right-2 top-2 rounded-full bg-ink/70 p-1.5 backdrop-blur-sm">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-cream">
                      <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
                      <line x1="20" y1="20" x2="15.5" y2="15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => elegirCorte(c)}
                  className="block w-full px-4 py-3 text-left transition-colors hover:bg-brass/5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-xl text-cream">{c.nombre}</span>
                    <span className="text-sm font-bold text-brass">S/ {c.precio}</span>
                  </div>
                  <p className="mt-1 text-sm text-cream/60">{c.descripcion}</p>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {paso === "barbero" && corte && (
        <section>
          <h2 className="font-display text-3xl uppercase text-cream">
            ¿Quién te atiende?
          </h2>
          <p className="mt-1 text-sm text-cream/60">Barberos disponibles para {corte.nombre}</p>

          <div className="mt-6 flex flex-col gap-3">
            <OpcionBarbero
              seleccionado={primeraOpcion === AUTO}
              onClick={() => setPrimeraOpcion(AUTO)}
              titulo="Asignación automática"
              subtitulo="Te asignamos el barbero libre disponible"
            />
            {barberos.map((b) => (
              <OpcionBarbero
                key={b.id}
                seleccionado={primeraOpcion === b.id}
                onClick={() => setPrimeraOpcion(b.id)}
                titulo={b.nombre}
              />
            ))}
          </div>

          <NavBotones
            atras={() => irA("corte")}
            siguiente={() => irA("backup")}
            siguienteDeshabilitado={primeraOpcion === null}
          />
        </section>
      )}

      {paso === "backup" && corte && (
        <section>
          <h2 className="font-display text-3xl uppercase text-cream">
            Opción de respaldo
          </h2>
          <p className="mt-1 text-sm text-cream/60">
            Por si tu primera opción no responde en 15 minutos
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <OpcionBarbero
              seleccionado={segundaOpcion === AUTO}
              onClick={() => setSegundaOpcion(AUTO)}
              titulo="Asignación automática"
            />
            {barberos
              .filter((b) => b.id !== primeraOpcion)
              .map((b) => (
                <OpcionBarbero
                  key={b.id}
                  seleccionado={segundaOpcion === b.id}
                  onClick={() => setSegundaOpcion(b.id)}
                  titulo={b.nombre}
                />
              ))}
          </div>

          <NavBotones
            atras={() => irA("barbero")}
            siguiente={() => irA("horario")}
            siguienteDeshabilitado={segundaOpcion === null}
          />
        </section>
      )}

      {paso === "horario" && (
        <section>
          <h2 className="font-display text-3xl uppercase text-cream">Fecha y hora</h2>

          <input
            type="date"
            min={hoyISO()}
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="mt-6 rounded border border-ink-border-2 bg-transparent px-4 py-3 text-cream outline-none focus:border-brass [color-scheme:dark]"
          />

          <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.length === 0 && (
              <p className="col-span-full text-sm text-cream/60">
                No hay horarios de atención ese día.
              </p>
            )}
            {slots.map((s) => (
                <button
                  key={s.horaInicio}
                  type="button"
                  disabled={!s.disponible}
                  onClick={() => setHoraInicio(s.horaInicio)}
                  className={cn(
                    "rounded border px-3 py-2 text-sm",
                    !s.disponible && "cursor-not-allowed border-ink-border text-cream/25",
                    s.disponible &&
                      horaInicio === s.horaInicio &&
                      "border-brass bg-brass/10 text-cream",
                    s.disponible &&
                      horaInicio !== s.horaInicio &&
                      "border-ink-border-2 text-cream hover:border-brass"
                  )}
                >
                  {s.horaInicio}
                </button>
              ))}
          </div>

          <NavBotones
            atras={() => irA("backup")}
            siguiente={() => irA("adicionales")}
            siguienteDeshabilitado={!horaInicio}
          />
        </section>
      )}

      {paso === "adicionales" && (
        <section>
          <h2 className="font-display text-3xl uppercase text-cream">Adicionales</h2>
          <p className="mt-1 text-sm text-cream/60">Opcional</p>

          <div className="mt-6 flex flex-col gap-3">
            {adicionales.map((a) => {
              const activo = adicionalesIds.includes(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() =>
                    setAdicionalesIds((prev) =>
                      activo ? prev.filter((id) => id !== a.id) : [...prev, a.id]
                    )
                  }
                  className={cn(
                    "flex items-center justify-between rounded border px-4 py-3 text-left",
                    activo ? "border-brass bg-brass/10" : "border-ink-border-2 hover:border-brass"
                  )}
                >
                  <span className="text-cream">{a.nombre}</span>
                  <span className="text-sm font-bold text-brass">S/ {a.precio}</span>
                </button>
              );
            })}
          </div>

          <NavBotones atras={() => irA("horario")} siguiente={() => irA("resumen")} />
        </section>
      )}

      {paso === "resumen" && corte && (
        <section>
          <h2 className="font-display text-3xl uppercase text-cream">Resumen</h2>

          <dl className="mt-6 flex flex-col gap-3 text-sm">
            <Fila etiqueta="Corte" valor={`${corte.nombre} · S/ ${corte.precio}`} />
            <Fila etiqueta="Barbero" valor={nombreBarbero(primeraOpcion)} />
            <Fila etiqueta="Respaldo" valor={nombreBarbero(segundaOpcion)} />
            <Fila etiqueta="Fecha" valor={fecha} />
            <Fila etiqueta="Hora" valor={horaInicio ?? "—"} />
            {adicionalesIds.length > 0 && (
              <Fila
                etiqueta="Adicionales"
                valor={adicionales
                  .filter((a) => adicionalesIds.includes(a.id))
                  .map((a) => `${a.nombre} (S/ ${a.precio})`)
                  .join(", ")}
              />
            )}
          </dl>

          <div className="mt-6 flex items-center justify-between border-t border-ink-border pt-4">
            <span className="font-display text-xl uppercase text-cream">Total</span>
            <span className="font-display text-2xl text-brass">S/ {total}</span>
          </div>

          <p className="mt-4 text-xs text-cream/50">
            El pago (Yape/Plin) se coordina una vez confirmada la reserva. Tu barbero
            tiene hasta 15 minutos para aceptar la cita.
          </p>

          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => irA("adicionales")}
              className="rounded-full border border-ink-border-2 px-6 py-3 text-[13px] font-bold uppercase tracking-[1px] text-cream hover:border-brass hover:text-brass"
            >
              Atrás
            </button>
            <button
              type="button"
              onClick={onConfirmar}
              disabled={enviando}
              className="flex-1 rounded-full bg-brass px-6 py-3 text-[13px] font-bold uppercase tracking-[1px] text-ink transition-colors hover:bg-brass-hover disabled:opacity-60"
            >
              {enviando ? "Reservando..." : "Confirmar reserva"}
            </button>
          </div>
        </section>
      )}

      {corteAmpliado && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-6"
          onClick={() => setCorteAmpliado(null)}
        >
          <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <PhotoBox
              src={corteAmpliado.fotoUrl ?? undefined}
              alt={corteAmpliado.nombre}
              label={`Foto pendiente: ${corteAmpliado.nombre}`}
              aspect="4/5"
              className="rounded"
              imgClassName="object-contain"
            />
            <div className="mt-4 text-center">
              <h3 className="font-display text-2xl uppercase text-cream">
                {corteAmpliado.nombre}
              </h3>
              <p className="mt-1 font-bold text-brass">S/ {corteAmpliado.precio}</p>
              <p className="mt-2 text-sm text-cream/70">{corteAmpliado.descripcion}</p>
            </div>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setCorteAmpliado(null)}
                className="rounded-full border border-ink-border-2 px-6 py-3 text-[13px] font-bold uppercase tracking-[1px] text-cream hover:border-brass hover:text-brass"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => elegirCorte(corteAmpliado)}
                className="flex-1 rounded-full bg-brass px-6 py-3 text-[13px] font-bold uppercase tracking-[1px] text-ink transition-colors hover:bg-brass-hover"
              >
                Elegir este corte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OpcionBarbero({
  seleccionado,
  onClick,
  titulo,
  subtitulo,
}: {
  seleccionado: boolean;
  onClick: () => void;
  titulo: string;
  subtitulo?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded border px-4 py-3 text-left transition-colors",
        seleccionado ? "border-brass bg-brass/10" : "border-ink-border-2 hover:border-brass"
      )}
    >
      <p className="text-cream">{titulo}</p>
      {subtitulo && <p className="mt-0.5 text-xs text-cream/50">{subtitulo}</p>}
    </button>
  );
}

function NavBotones({
  atras,
  siguiente,
  siguienteDeshabilitado,
}: {
  atras: () => void;
  siguiente: () => void;
  siguienteDeshabilitado?: boolean;
}) {
  return (
    <div className="mt-6 flex gap-3">
      <button
        type="button"
        onClick={atras}
        className="rounded-full border border-ink-border-2 px-6 py-3 text-[13px] font-bold uppercase tracking-[1px] text-cream hover:border-brass hover:text-brass"
      >
        Atrás
      </button>
      <button
        type="button"
        onClick={siguiente}
        disabled={siguienteDeshabilitado}
        className="flex-1 rounded-full bg-brass px-6 py-3 text-[13px] font-bold uppercase tracking-[1px] text-ink transition-colors hover:bg-brass-hover disabled:opacity-40"
      >
        Siguiente
      </button>
    </div>
  );
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-ink-border pb-2">
      <dt className="text-cream/60">{etiqueta}</dt>
      <dd className="text-right text-cream">{valor}</dd>
    </div>
  );
}
