"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { PhotoBox } from "@/components/landing/photo-box";
import { buscarClientes, registrarServicio } from "./actions";

type Corte = {
  id: string;
  nombre: string;
  precio: number;
  descripcion: string;
  fotoUrl: string | null;
};
type AdicionalItem = { id: string; nombre: string; precio: number };
type ClienteResultado = { id: string; nombre: string; celular: string | null };

type Paso = "cliente" | "corte" | "resumen";

export function ServicioForm({
  cortes,
  adicionales,
}: {
  cortes: Corte[];
  adicionales: AdicionalItem[];
}) {
  const router = useRouter();
  const [paso, setPaso] = useState<Paso>("cliente");

  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<ClienteResultado[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteResultado | null>(null);
  const [sinRegistro, setSinRegistro] = useState(false);

  const [corteId, setCorteId] = useState<string | null>(null);
  const [adicionalesIds, setAdicionalesIds] = useState<string[]>([]);

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    let cancelado = false;
    if (query.trim().length < 2) {
      Promise.resolve().then(() => {
        if (!cancelado) setResultados([]);
      });
      return () => {
        cancelado = true;
      };
    }
    debounceRef.current = setTimeout(() => {
      buscarClientes(query).then((r) => {
        if (!cancelado) setResultados(r);
      });
    }, 300);
    return () => {
      cancelado = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function elegirCliente(c: ClienteResultado) {
    setClienteSeleccionado(c);
    setSinRegistro(false);
    setQuery("");
    setResultados([]);
  }

  function elegirSinRegistro() {
    setClienteSeleccionado(null);
    setSinRegistro(true);
    setQuery("");
    setResultados([]);
  }

  function alternarAdicional(id: string) {
    setAdicionalesIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const corte = cortes.find((c) => c.id === corteId) ?? null;
  const totalAdicionales = adicionales
    .filter((a) => adicionalesIds.includes(a.id))
    .reduce((s, a) => s + a.precio, 0);
  const total = (corte?.precio ?? 0) + totalAdicionales;

  async function confirmar() {
    if (!corteId) return;
    setEnviando(true);
    setError(null);
    const resultado = await registrarServicio({
      clienteId: clienteSeleccionado?.id ?? null,
      corteId,
      adicionalesIds,
    });
    setEnviando(false);
    if ("error" in resultado && resultado.error) {
      setError(resultado.error);
      return;
    }
    setExito(true);
    router.refresh();
  }

  if (exito) {
    return (
      <div className="rounded border border-brass px-6 py-8 text-center">
        <p className="font-display text-2xl uppercase text-brass">Servicio registrado</p>
        <p className="mt-2 text-sm text-cream/70">
          Tu horario quedó bloqueado. Cuando termines, márcalo como completado desde tu panel.
        </p>
        <button
          type="button"
          onClick={() => router.push("/barbero")}
          className="mt-5 rounded-full bg-brass px-6 py-2.5 text-xs font-bold uppercase tracking-wide text-ink transition-colors hover:bg-brass-hover"
        >
          Volver a mi panel
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2 text-xs uppercase tracking-wide text-cream/50">
        <span className={cn(paso === "cliente" && "text-brass")}>1. Cliente</span>
        <span>·</span>
        <span className={cn(paso === "corte" && "text-brass")}>2. Corte</span>
        <span>·</span>
        <span className={cn(paso === "resumen" && "text-brass")}>3. Confirmar</span>
      </div>

      {paso === "cliente" && (
        <div className="mt-4">
          {clienteSeleccionado ? (
            <div className="flex items-center justify-between rounded border border-brass px-4 py-3">
              <span className="text-cream">
                {clienteSeleccionado.nombre}
                {clienteSeleccionado.celular ? ` · ${clienteSeleccionado.celular}` : ""}
              </span>
              <button
                type="button"
                onClick={() => setClienteSeleccionado(null)}
                className="text-xs text-cream/50 hover:text-brass"
              >
                Cambiar
              </button>
            </div>
          ) : sinRegistro ? (
            <div className="flex items-center justify-between rounded border border-brass px-4 py-3">
              <span className="text-cream">Cliente no registrado</span>
              <button
                type="button"
                onClick={() => setSinRegistro(false)}
                className="text-xs text-cream/50 hover:text-brass"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <>
              <label className="text-xs uppercase tracking-wide text-cream/50" htmlFor="buscarCliente">
                Buscar cliente por nombre o celular
              </label>
              <input
                id="buscarCliente"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ej. Jenny o 991178471"
                className="mt-1 w-full rounded border border-ink-border-2 bg-transparent px-3 py-2 text-sm text-cream outline-none focus:border-brass"
              />
              {resultados.length > 0 && (
                <div className="mt-2 flex flex-col gap-1.5">
                  {resultados.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => elegirCliente(c)}
                      className="rounded border border-ink-border-2 px-4 py-2.5 text-left text-sm text-cream transition-colors hover:border-brass"
                    >
                      {c.nombre} {c.celular ? `· ${c.celular}` : ""}
                    </button>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={elegirSinRegistro}
                className="mt-3 text-sm text-cream/60 underline hover:text-brass"
              >
                Cliente no registrado
              </button>
            </>
          )}

          <button
            type="button"
            disabled={!clienteSeleccionado && !sinRegistro}
            onClick={() => setPaso("corte")}
            className="mt-6 rounded-full bg-brass px-6 py-2.5 text-xs font-bold uppercase tracking-wide text-ink transition-colors hover:bg-brass-hover disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      )}

      {paso === "corte" && (
        <div className="mt-4">
          <p className="text-xs uppercase tracking-wide text-cream/50">Corte</p>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {cortes.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCorteId(c.id)}
                className={cn(
                  "overflow-hidden rounded border text-left transition-colors",
                  corteId === c.id ? "border-brass" : "border-ink-border-2 hover:border-brass/50"
                )}
              >
                <PhotoBox
                  src={c.fotoUrl ?? undefined}
                  alt={c.nombre}
                  label={c.nombre}
                  aspect="4/3"
                />
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-cream">{c.nombre}</span>
                    <span className="text-sm font-bold text-brass">S/ {c.precio}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <p className="mt-6 text-xs uppercase tracking-wide text-cream/50">
            Adicionales (opcional)
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            {adicionales.map((a) => (
              <label key={a.id} className="flex items-center gap-1.5 text-sm text-cream/80">
                <input
                  type="checkbox"
                  checked={adicionalesIds.includes(a.id)}
                  onChange={() => alternarAdicional(a.id)}
                />
                {a.nombre} (S/ {a.precio})
              </label>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setPaso("cliente")}
              className="rounded-full border border-ink-border-2 px-5 py-2 text-xs font-bold uppercase tracking-wide text-cream hover:border-brass hover:text-brass"
            >
              Atrás
            </button>
            <button
              type="button"
              disabled={!corteId}
              onClick={() => setPaso("resumen")}
              className="rounded-full bg-brass px-6 py-2.5 text-xs font-bold uppercase tracking-wide text-ink transition-colors hover:bg-brass-hover disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {paso === "resumen" && corte && (
        <div className="mt-4">
          <div className="rounded border border-ink-border-2 p-5">
            <p className="text-xs uppercase tracking-wide text-cream/50">Cliente</p>
            <p className="text-cream">
              {clienteSeleccionado
                ? `${clienteSeleccionado.nombre}${clienteSeleccionado.celular ? " · " + clienteSeleccionado.celular : ""}`
                : "Cliente no registrado"}
            </p>

            <p className="mt-3 text-xs uppercase tracking-wide text-cream/50">Corte</p>
            <p className="text-cream">
              {corte.nombre} · S/ {corte.precio}
            </p>

            {adicionalesIds.length > 0 && (
              <>
                <p className="mt-3 text-xs uppercase tracking-wide text-cream/50">Adicionales</p>
                <p className="text-cream">
                  {adicionales
                    .filter((a) => adicionalesIds.includes(a.id))
                    .map((a) => a.nombre)
                    .join(", ")}
                </p>
              </>
            )}

            <p className="mt-4 border-t border-ink-border-2 pt-4 font-display text-2xl text-brass">
              Total: S/ {total}
            </p>
          </div>

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setPaso("corte")}
              disabled={enviando}
              className="rounded-full border border-ink-border-2 px-5 py-2 text-xs font-bold uppercase tracking-wide text-cream hover:border-brass hover:text-brass"
            >
              Atrás
            </button>
            <button
              type="button"
              onClick={confirmar}
              disabled={enviando}
              className="rounded-full bg-brass px-6 py-2.5 text-xs font-bold uppercase tracking-wide text-ink transition-colors hover:bg-brass-hover disabled:opacity-60"
            >
              {enviando ? "Registrando..." : "Confirmar servicio"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
