import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { NuevoBarberoForm } from "./nuevo-barbero-form";
import { EditarBarberoForm } from "./editar-barbero-form";
import { CalificacionesBarbero } from "./calificaciones-barbero";
import { PublicarComentarioBoton } from "./publicar-comentario-boton";

export default async function AdminBarberosPage({
  searchParams,
}: {
  searchParams: Promise<{ barberoId?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.rol !== "ADMIN") redirect("/cuenta");

  const params = await searchParams;

  const [barberos, cortes, citasCalificadas] = await Promise.all([
    prisma.barbero.findMany({
      include: { user: true, cortes: true },
      orderBy: { user: { nombre: "asc" } },
    }),
    prisma.corte.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } }),
    prisma.cita.findMany({
      where: { calificacionEstrellas: { not: null } },
      select: {
        id: true,
        barberoId: true,
        calificacionEstrellas: true,
        calificacionComentario: true,
        calificacionPublicada: true,
        cliente: { select: { nombre: true } },
        corte: { select: { nombre: true } },
        barbero: { select: { user: { select: { nombre: true } } } },
      },
      orderBy: { calificadaEn: "desc" },
    }),
  ]);

  const cortesOpciones = cortes.map((c) => ({ id: c.id, nombre: c.nombre }));

  type ComentarioBarbero = {
    citaId: string;
    cliente: string;
    corte: string;
    estrellas: number;
    comentario: string | null;
    publicado: boolean;
  };

  const calificacionesPorBarbero = new Map<
    string,
    { estrellas: number[]; comentarios: ComentarioBarbero[] }
  >();
  const publicados: (ComentarioBarbero & { barbero: string })[] = [];
  for (const c of citasCalificadas) {
    if (!c.barberoId || c.calificacionEstrellas === null) continue;
    const actual = calificacionesPorBarbero.get(c.barberoId) ?? { estrellas: [], comentarios: [] };
    actual.estrellas.push(c.calificacionEstrellas);
    const comentario: ComentarioBarbero = {
      citaId: c.id,
      cliente: c.cliente?.nombre ?? "Cliente no registrado",
      corte: c.corte.nombre,
      estrellas: c.calificacionEstrellas,
      comentario: c.calificacionComentario,
      publicado: c.calificacionPublicada,
    };
    actual.comentarios.push(comentario);
    calificacionesPorBarbero.set(c.barberoId, actual);
    if (c.calificacionPublicada && c.barbero) {
      publicados.push({ ...comentario, barbero: c.barbero.user.nombre });
    }
  }

  const barberoSeleccionado =
    (params.barberoId ? barberos.find((b) => b.id === params.barberoId) : undefined) ??
    barberos[0];

  return (
    <div className="min-h-screen bg-ink px-6 py-16 sm:px-[6vw]">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-4xl uppercase text-cream">Barberos</h1>
          <Link href="/admin" className="text-sm text-cream/60 hover:text-brass">
            Volver al panel
          </Link>
        </div>

        <div className="mt-8">
          <NuevoBarberoForm cortes={cortesOpciones} />
        </div>

        <p className="mt-10 text-xs uppercase tracking-wide text-cream/50">
          Barberos existentes
        </p>
        <div className="mt-3 flex flex-col gap-1.5">
          {barberos.map((b) => {
            const calif = calificacionesPorBarbero.get(b.id);
            const promedio = calif
              ? calif.estrellas.reduce((s, n) => s + n, 0) / calif.estrellas.length
              : null;
            const seleccionado = b.id === barberoSeleccionado?.id;
            return (
              <Link
                key={b.id}
                href={`/admin/barberos?barberoId=${b.id}`}
                className={cn(
                  "flex items-center justify-between rounded border px-4 py-2.5 text-sm transition-colors",
                  seleccionado
                    ? "border-brass text-brass"
                    : "border-ink-border-2 text-cream hover:border-brass/50"
                )}
              >
                <span>
                  {b.user.nombre}{" "}
                  <span className={cn("text-xs", seleccionado ? "text-brass/70" : "text-cream/50")}>
                    {b.activo ? "· activo" : "· inactivo"}
                  </span>
                </span>
                <span className="text-xs">{promedio !== null ? `${promedio.toFixed(1)} ★` : "—"}</span>
              </Link>
            );
          })}
        </div>

        {barberoSeleccionado && (
          <div className="mt-6">
            <EditarBarberoForm
              key={barberoSeleccionado.id}
              barberoId={barberoSeleccionado.id}
              nombre={barberoSeleccionado.user.nombre}
              celular={barberoSeleccionado.user.celular}
              comisionInicial={Number(barberoSeleccionado.comisionPorcentaje)}
              activoInicial={barberoSeleccionado.activo}
              cortes={cortesOpciones}
              corteIdsInicial={barberoSeleccionado.cortes.map((bc) => bc.corteId)}
            />
            <CalificacionesBarbero
              promedio={
                calificacionesPorBarbero.get(barberoSeleccionado.id)
                  ? calificacionesPorBarbero
                      .get(barberoSeleccionado.id)!
                      .estrellas.reduce((s, n) => s + n, 0) /
                    calificacionesPorBarbero.get(barberoSeleccionado.id)!.estrellas.length
                  : null
              }
              total={calificacionesPorBarbero.get(barberoSeleccionado.id)?.estrellas.length ?? 0}
              comentarios={calificacionesPorBarbero.get(barberoSeleccionado.id)?.comentarios ?? []}
            />
          </div>
        )}

        {publicados.length > 0 && (
          <div className="mt-10">
            <p className="text-xs uppercase tracking-wide text-cream/50">
              Comentarios publicados en el landing
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {publicados.map((c) => (
                <div key={c.citaId} className="rounded border border-brass/40 px-3 py-2 text-xs">
                  <div className="flex gap-0.5 text-sm leading-none">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span
                        key={n}
                        className={cn(n <= c.estrellas ? "text-brass" : "text-ink-border-2")}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="mt-0.5 text-cream/70">
                    {c.cliente} · {c.barbero} — &ldquo;{c.comentario}&rdquo;
                  </p>
                  <div className="mt-1">
                    <PublicarComentarioBoton citaId={c.citaId} publicadoInicial />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
