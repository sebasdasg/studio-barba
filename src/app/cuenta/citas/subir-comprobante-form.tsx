"use client";

import { useActionState } from "react";
import { subirComprobante, type SubirComprobanteState } from "./pago-actions";

const estadoInicial: SubirComprobanteState = {};

export function SubirComprobanteForm({ citaId }: { citaId: string }) {
  const [estado, formAction, pendiente] = useActionState(subirComprobante, estadoInicial);

  if (estado.ok) {
    return (
      <p className="mt-3 border-t border-ink-border pt-3 text-xs text-brass">
        Comprobante enviado — en revisión.
      </p>
    );
  }

  return (
    <form
      action={formAction}
      className="mt-3 flex flex-col gap-2 border-t border-ink-border pt-3"
    >
      <input type="hidden" name="citaId" value={citaId} />
      <p className="text-xs uppercase tracking-wide text-cream/50">
        Subir comprobante de pago
      </p>

      <div className="flex gap-3 text-xs text-cream/70">
        <label className="flex items-center gap-1.5">
          <input type="radio" name="tipo" value="ADELANTO" defaultChecked required />
          Adelanto
        </label>
        <label className="flex items-center gap-1.5">
          <input type="radio" name="tipo" value="TOTAL" required />
          Pago total
        </label>
      </div>

      <input
        type="number"
        name="monto"
        step="0.01"
        min="0.01"
        placeholder="Monto pagado (S/)"
        required
        className="rounded border border-ink-border-2 bg-transparent px-3 py-2 text-sm text-cream outline-none focus:border-brass"
      />

      <input
        type="file"
        name="archivo"
        accept="image/*"
        required
        className="text-xs text-cream/70 file:mr-3 file:rounded-full file:border-0 file:bg-brass file:px-3 file:py-1.5 file:text-xs file:font-bold file:uppercase file:text-ink"
      />

      {estado.error && <p className="text-xs text-red-400">{estado.error}</p>}

      <button
        type="submit"
        disabled={pendiente}
        className="mt-1 w-fit rounded-full bg-brass px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink transition-colors hover:bg-brass-hover disabled:opacity-60"
      >
        {pendiente ? "Subiendo..." : "Subir"}
      </button>
    </form>
  );
}
