"use client";

import { use, useActionState } from "react";
import Link from "next/link";
import { verificarCorreo, type VerificarState } from "./actions";

const estadoInicial: VerificarState = {};

export default function VerificarPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const accionConToken = verificarCorreo.bind(null, token);
  const [estado, formAction, pendiente] = useActionState(accionConToken, estadoInicial);

  if (estado.ok) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink px-6 py-16">
        <div className="w-full max-w-sm text-center">
          <h1 className="font-display text-4xl uppercase text-cream">Cuenta verificada</h1>
          <p className="mt-3 text-sm text-cream/60">Ya puedes iniciar sesión.</p>
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
      <div className="w-full max-w-sm text-center">
        <h1 className="font-display text-4xl uppercase text-cream">Confirma tu correo</h1>
        <p className="mt-3 text-sm text-cream/60">
          Haz clic para terminar de verificar tu cuenta en Studio Barba.
        </p>

        {estado.error && <p className="mt-4 text-sm text-red-400">{estado.error}</p>}

        <form action={formAction} className="mt-6">
          <button
            type="submit"
            disabled={pendiente}
            className="rounded-full bg-brass px-6 py-3 text-[13px] font-bold uppercase tracking-[1px] text-ink transition-colors hover:bg-brass-hover disabled:opacity-60"
          >
            {pendiente ? "Verificando..." : "Verificar mi cuenta"}
          </button>
        </form>
      </div>
    </div>
  );
}
