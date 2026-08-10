"use client";

import { useActionState } from "react";
import Link from "next/link";
import { solicitarRecuperacion, type RecuperarState } from "./actions";

const estadoInicial: RecuperarState = {};

export default function RecuperarPage() {
  const [estado, formAction, pendiente] = useActionState(solicitarRecuperacion, estadoInicial);

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-center font-display text-4xl uppercase text-cream">
          Recuperar contraseña
        </h1>
        <p className="mt-3 text-center text-sm text-cream/60">
          Ingresa tu celular o correo. Si tu cuenta tiene un correo registrado, te enviaremos un
          enlace para elegir una nueva contraseña.
        </p>

        {estado.mensaje ? (
          <p className="mt-8 rounded border border-brass px-4 py-3 text-center text-sm text-brass">
            {estado.mensaje}
          </p>
        ) : (
          <form action={formAction} className="mt-8 flex flex-col gap-4">
            <div>
              <label
                className="text-xs uppercase tracking-wide text-cream/60"
                htmlFor="celularOEmail"
              >
                Celular o correo
              </label>
              <input
                id="celularOEmail"
                name="celularOEmail"
                required
                className="mt-1.5 w-full rounded border border-ink-border-2 bg-transparent px-4 py-3 text-cream outline-none focus:border-brass"
              />
            </div>

            {estado.error && <p className="text-sm text-red-400">{estado.error}</p>}

            <button
              type="submit"
              disabled={pendiente}
              className="mt-2 rounded-full bg-brass px-6 py-3 text-[13px] font-bold uppercase tracking-[1px] text-ink transition-colors hover:bg-brass-hover disabled:opacity-60"
            >
              {pendiente ? "Enviando..." : "Enviar enlace"}
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-sm text-cream/60">
          <Link href="/login" className="text-brass hover:text-brass-hover">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
