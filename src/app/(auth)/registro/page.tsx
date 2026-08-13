"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registrarCliente, type RegistroState } from "./actions";

const estadoInicial: RegistroState = {};

export default function RegistroPage() {
  const [estado, formAction, pendiente] = useActionState(registrarCliente, estadoInicial);

  if (estado.ok) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink px-6 py-16">
        <div className="w-full max-w-sm text-center">
          <h1 className="font-display text-4xl uppercase text-cream">Revisa tu correo</h1>
          <p className="mt-3 text-sm text-cream/60">
            Te enviamos un enlace para confirmar tu cuenta. Ábrelo para poder iniciar sesión.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-full bg-brass px-6 py-3 text-[13px] font-bold uppercase tracking-[1px] text-ink transition-colors hover:bg-brass-hover"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-center font-display text-4xl uppercase text-cream">
          Crear cuenta
        </h1>

        <form action={formAction} className="mt-8 flex flex-col gap-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-cream/60" htmlFor="nombre">
              Nombre
            </label>
            <input
              id="nombre"
              name="nombre"
              required
              className="mt-1.5 w-full rounded border border-ink-border-2 bg-transparent px-4 py-3 text-cream outline-none focus:border-brass"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-cream/60" htmlFor="celular">
              Celular
            </label>
            <input
              id="celular"
              name="celular"
              inputMode="numeric"
              placeholder="9XXXXXXXX"
              required
              className="mt-1.5 w-full rounded border border-ink-border-2 bg-transparent px-4 py-3 text-cream outline-none focus:border-brass"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-cream/60" htmlFor="email">
              Correo
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1.5 w-full rounded border border-ink-border-2 bg-transparent px-4 py-3 text-cream outline-none focus:border-brass"
            />
            <p className="mt-1 text-xs text-cream/40">
              Te enviaremos un enlace para confirmar tu cuenta y, si lo necesitas, recuperar tu
              contraseña.
            </p>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-cream/60" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              minLength={8}
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
            {pendiente ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-cream/60">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-brass hover:text-brass-hover">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
