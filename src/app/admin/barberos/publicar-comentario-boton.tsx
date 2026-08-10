"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { publicarComentario } from "./comentarios-actions";

export function PublicarComentarioBoton({
  citaId,
  publicadoInicial,
}: {
  citaId: string;
  publicadoInicial: boolean;
}) {
  const router = useRouter();
  const [publicado, setPublicado] = useState(publicadoInicial);
  const [cargando, setCargando] = useState(false);

  async function alternar() {
    setCargando(true);
    const resultado = await publicarComentario(citaId, !publicado);
    setCargando(false);
    if ("ok" in resultado) {
      setPublicado(!publicado);
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={alternar}
      disabled={cargando}
      className={
        publicado
          ? "rounded-full border border-brass px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-brass transition-colors hover:bg-brass hover:text-ink disabled:opacity-60"
          : "rounded-full border border-ink-border-2 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-cream/70 transition-colors hover:border-brass hover:text-brass disabled:opacity-60"
      }
    >
      {cargando ? "..." : publicado ? "Publicado ✓ (quitar)" : "Publicar en landing"}
    </button>
  );
}
