"use client";

import { useActionState, useState } from "react";
import { cn } from "@/lib/utils";
import { calificarCita, type CalificarState } from "./calificacion-actions";

const estadoInicial: CalificarState = {};

export function CalificarForm({ citaId }: { citaId: string }) {
  const [estado, formAction, pendiente] = useActionState(calificarCita, estadoInicial);
  const [estrellas, setEstrellas] = useState(0);
  const [hover, setHover] = useState(0);

  if (estado.ok) {
    return (
      <p className="mt-3 border-t border-ink-border pt-3 text-xs text-brass">
        ¡Gracias por tu calificación!
      </p>
    );
  }

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-2 border-t border-ink-border pt-3">
      <input type="hidden" name="citaId" value={citaId} />
      <input type="hidden" name="estrellas" value={estrellas} readOnly />

      <p className="text-xs uppercase tracking-wide text-cream/50">¿Cómo estuvo tu corte?</p>

      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setEstrellas(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
            className="text-2xl leading-none"
          >
            <span className={cn((hover || estrellas) >= n ? "text-brass" : "text-ink-border-2")}>
              ★
            </span>
          </button>
        ))}
      </div>

      <textarea
        name="comentario"
        placeholder="Comentario (opcional)"
        rows={2}
        className="rounded border border-ink-border-2 bg-transparent px-3 py-2 text-sm text-cream outline-none focus:border-brass"
      />

      {estado.error && <p className="text-xs text-red-400">{estado.error}</p>}

      <button
        type="submit"
        disabled={pendiente || estrellas === 0}
        className="mt-1 w-fit rounded-full bg-brass px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink transition-colors hover:bg-brass-hover disabled:opacity-60"
      >
        {pendiente ? "Enviando..." : "Enviar calificación"}
      </button>
    </form>
  );
}
