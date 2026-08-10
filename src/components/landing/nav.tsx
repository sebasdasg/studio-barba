"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const links = [
  { href: "#catalogo", label: "Cortes" },
  { href: "#nosotros", label: "Nosotros" },
  { href: "#testimonios", label: "Opiniones" },
  { href: "#contacto", label: "Contacto" },
];

export function Nav() {
  const [abierto, setAbierto] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-ink-border bg-ink-3/75 px-[6vw] py-5 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between">
        <a href="#" className="font-display text-[28px] tracking-[2px] text-cream">
          STUDIO BARBA
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[13px] font-medium uppercase tracking-[1.5px] text-cream/90 transition-colors hover:text-brass"
            >
              {link.label}
            </a>
          ))}
          <a
            href="/reservar"
            className="rounded-full bg-brass px-[22px] py-2.5 text-[13px] font-bold uppercase tracking-[1px] text-ink transition-colors hover:bg-brass-hover"
          >
            Reservar cita
          </a>
        </nav>

        <button
          type="button"
          aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={abierto}
          onClick={() => setAbierto((v) => !v)}
          className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 md:hidden"
        >
          <span
            className={cn(
              "h-[2px] w-6 bg-cream transition-transform",
              abierto && "translate-y-[7px] rotate-45"
            )}
          />
          <span className={cn("h-[2px] w-6 bg-cream transition-opacity", abierto && "opacity-0")} />
          <span
            className={cn(
              "h-[2px] w-6 bg-cream transition-transform",
              abierto && "-translate-y-[7px] -rotate-45"
            )}
          />
        </button>
      </div>

      {abierto && (
        <nav className="mx-auto flex max-w-[1400px] flex-col gap-5 pt-6 md:hidden">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setAbierto(false)}
              className="text-sm font-medium uppercase tracking-[1.5px] text-cream/90"
            >
              {link.label}
            </a>
          ))}
          <a
            href="/reservar"
            onClick={() => setAbierto(false)}
            className="w-fit rounded-full bg-brass px-[22px] py-2.5 text-[13px] font-bold uppercase tracking-[1px] text-ink"
          >
            Reservar cita
          </a>
        </nav>
      )}
    </header>
  );
}
