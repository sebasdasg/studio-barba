"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { actualizarCliente } from "./actions";

export function EditarClienteForm({
  clienteId,
  nombreInicial,
  celularInicial,
  emailInicial,
  activoInicial,
}: {
  clienteId: string;
  nombreInicial: string;
  celularInicial: string | null;
  emailInicial: string | null;
  activoInicial: boolean;
}) {
  const router = useRouter();
  const [nombre, setNombre] = useState(nombreInicial);
  const [celular, setCelular] = useState(celularInicial ?? "");
  const [email, setEmail] = useState(emailInicial ?? "");
  const [activo, setActivo] = useState(activoInicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  async function guardar() {
    setGuardando(true);
    setError(null);
    setGuardado(false);
    const resultado = await actualizarCliente(clienteId, { nombre, celular, email, activo });
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
        <p className="font-display text-xl uppercase text-cream">{nombreInicial}</p>
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

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs uppercase tracking-wide text-cream/50">Nombre</label>
          <input
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              setGuardado(false);
            }}
            className="mt-1 w-full rounded border border-ink-border-2 bg-transparent px-3 py-1.5 text-sm text-cream outline-none focus:border-brass"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-cream/50">Celular</label>
          <input
            value={celular}
            inputMode="numeric"
            onChange={(e) => {
              setCelular(e.target.value);
              setGuardado(false);
            }}
            className="mt-1 w-full rounded border border-ink-border-2 bg-transparent px-3 py-1.5 text-sm text-cream outline-none focus:border-brass"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs uppercase tracking-wide text-cream/50">Correo</label>
          <input
            value={email}
            type="email"
            placeholder="Sin correo registrado"
            onChange={(e) => {
              setEmail(e.target.value);
              setGuardado(false);
            }}
            className="mt-1 w-full rounded border border-ink-border-2 bg-transparent px-3 py-1.5 text-sm text-cream outline-none focus:border-brass"
          />
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      {guardado && <p className="mt-3 text-sm text-brass">Cambios guardados.</p>}

      <button
        type="button"
        onClick={guardar}
        disabled={guardando}
        className="mt-4 rounded-full border border-ink-border-2 px-5 py-2 text-xs font-bold uppercase tracking-wide text-cream transition-colors hover:border-brass hover:text-brass disabled:opacity-60"
      >
        {guardando ? "Guardando..." : "Guardar cambios"}
      </button>
    </div>
  );
}
