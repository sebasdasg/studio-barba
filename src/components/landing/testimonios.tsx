import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

const TESTIMONIOS_RESPALDO = [
  {
    nombre: "Renato V.",
    texto:
      "Voy hace meses y siempre salgo con el corte que pedí, tal cual. El fade queda perfecto.",
    estrellas: null as number | null,
  },
  {
    nombre: "Diego M.",
    texto:
      "Me animé con un corte más moderno y el barbero me ayudó a elegir el que mejor iba con mi cara.",
    estrellas: null as number | null,
  },
  {
    nombre: "Álvaro S.",
    texto:
      "Buena atención, puntualidad y el ambiente se siente cuidado. Ya es mi barbería de siempre.",
    estrellas: null as number | null,
  },
];

export async function Testimonios() {
  const publicados = await prisma.cita.findMany({
    where: { calificacionPublicada: true },
    select: {
      calificacionEstrellas: true,
      calificacionComentario: true,
      calificadaEn: true,
      cliente: { select: { nombre: true } },
    },
    orderBy: { calificadaEn: "desc" },
    take: 6,
  });

  const testimonios =
    publicados.length > 0
      ? publicados.map((p) => ({
          nombre: p.cliente?.nombre ?? "Cliente",
          texto: p.calificacionComentario ?? "",
          estrellas: p.calificacionEstrellas,
        }))
      : TESTIMONIOS_RESPALDO;

  return (
    <section id="testimonios" className="bg-ink-2 px-6 py-[120px] sm:px-[6vw]">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-14 text-center">
          <p className="text-[13px] font-bold uppercase tracking-[3px] text-brass">
            Lo que dicen
          </p>
          <h2 className="mt-3 font-display text-[clamp(40px,5vw,64px)] uppercase text-cream">
            Clientes que repiten
          </h2>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
          {testimonios.map((t) => (
            <div
              key={t.nombre}
              className="rounded-md border border-ink-border bg-[oklch(20%_0.015_55)] p-7 sm:p-8"
            >
              {t.estrellas !== null ? (
                <div className="flex gap-0.5 text-lg leading-none">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span
                      key={n}
                      className={cn(n <= t.estrellas! ? "text-brass" : "text-ink-border")}
                    >
                      ★
                    </span>
                  ))}
                </div>
              ) : (
                <p className="font-display text-4xl leading-none text-brass">&ldquo;</p>
              )}
              <p className="mt-3 text-[15px] text-cream/85">{t.texto}</p>
              <p className="mt-5 text-[13px] font-bold uppercase tracking-[1px] text-cream">
                {t.nombre}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
