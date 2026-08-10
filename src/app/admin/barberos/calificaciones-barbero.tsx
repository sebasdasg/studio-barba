import { cn } from "@/lib/utils";
import { PublicarComentarioBoton } from "./publicar-comentario-boton";

type Comentario = {
  citaId: string;
  cliente: string;
  corte: string;
  estrellas: number;
  comentario: string | null;
  publicado: boolean;
};

export function CalificacionesBarbero({
  promedio,
  total,
  comentarios,
}: {
  promedio: number | null;
  total: number;
  comentarios: Comentario[];
}) {
  if (promedio === null) {
    return <p className="mt-2 text-xs text-cream/40">Sin calificaciones todavía.</p>;
  }

  return (
    <div className="mt-2 rounded border border-ink-border-2/60 px-3 py-2">
      <p className="text-sm text-cream">
        <span className="font-bold text-brass">{promedio.toFixed(1)} ★</span>{" "}
        <span className="text-cream/50">
          ({total} {total === 1 ? "reseña" : "reseñas"})
        </span>
      </p>
      {comentarios.length > 0 && (
        <div className="mt-2 flex flex-col gap-2">
          {comentarios.map((c) => (
            <div key={c.citaId} className="text-xs text-cream/60">
              <div className="flex gap-0.5 text-sm leading-none">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} className={cn(n <= c.estrellas ? "text-brass" : "text-ink-border-2")}>
                    ★
                  </span>
                ))}
              </div>
              <p className="mt-0.5">
                {c.cliente} · {c.corte}
                {c.comentario && <> — &ldquo;{c.comentario}&rdquo;</>}
              </p>
              {c.comentario && (
                <div className="mt-1">
                  <PublicarComentarioBoton citaId={c.citaId} publicadoInicial={c.publicado} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
