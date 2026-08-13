"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [celular, setCelular] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    const res = await signIn("credentials", { celular, password, redirect: false });

    setCargando(false);

    if (res?.error) {
      setError(
        res.code === "correo_no_verificado"
          ? "Todavía no confirmaste tu correo. Revisa el enlace que te enviamos al registrarte."
          : "Celular o contraseña incorrectos."
      );
      return;
    }

    router.push("/cuenta");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-center font-display text-4xl uppercase text-cream">
          Iniciar sesión
        </h1>

        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-cream/60" htmlFor="celular">
              Celular
            </label>
            <input
              id="celular"
              inputMode="numeric"
              placeholder="9XXXXXXXX"
              value={celular}
              onChange={(e) => setCelular(e.target.value)}
              required
              className="mt-1.5 w-full rounded border border-ink-border-2 bg-transparent px-4 py-3 text-cream outline-none focus:border-brass"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-wide text-cream/60" htmlFor="password">
                Contraseña
              </label>
              <Link href="/recuperar" className="text-xs text-cream/50 hover:text-brass">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1.5 w-full rounded border border-ink-border-2 bg-transparent px-4 py-3 text-cream outline-none focus:border-brass"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={cargando}
            className="mt-2 rounded-full bg-brass px-6 py-3 text-[13px] font-bold uppercase tracking-[1px] text-ink transition-colors hover:bg-brass-hover disabled:opacity-60"
          >
            {cargando ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-ink-border" />
          <span className="text-xs uppercase text-cream/40">o</span>
          <div className="h-px flex-1 bg-ink-border" />
        </div>

        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/cuenta" })}
          className="w-full rounded-full border border-ink-border-2 px-6 py-3 text-[13px] font-bold uppercase tracking-[1px] text-cream transition-colors hover:border-brass hover:text-brass"
        >
          Continuar con Google
        </button>

        <p className="mt-8 text-center text-sm text-cream/60">
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="text-brass hover:text-brass-hover">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
