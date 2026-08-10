import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { AccionesConfirmada, AccionesPendiente } from "./acciones-cita";

const ESTADO_LABEL: Record<string, string> = {
  RESERVADA: "Reservada",
  CONFIRMADA: "Confirmada",
  REQUIERE_ADMIN: "En revisión por el local",
  COMPLETADA: "Completada",
  NO_SHOW: "No asistió",
  // Hoy una cita solo llega a CANCELADA por acción del cliente (no existe
  // cancelación por admin todavía) — si eso cambia, este label deja de ser
  // preciso y hay que distinguir el motivo.
  CANCELADA: "Cancelada por el cliente",
  REPROGRAMADA: "Reprogramada",
};

function CitaCard({
  cita,
  children,
}: {
  cita: {
    id: string;
    fecha: Date;
    horaInicio: string;
    corte: { nombre: string };
    cliente: { nombre: string; celular: string | null } | null;
    adicionales: { adicional: { nombre: string } }[];
    estado: string;
    esPresencial: boolean;
    calificacionEstrellas: number | null;
    calificacionComentario: string | null;
  };
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded border border-ink-border-2 px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-xl uppercase text-cream">{cita.corte.nombre}</p>
          <p className="mt-1 text-sm text-cream/70">
            {new Date(cita.fecha).toLocaleDateString("es-PE", {
              weekday: "long",
              day: "numeric",
              month: "long",
              timeZone: "UTC",
            })}{" "}
            · {cita.horaInicio}
          </p>
          <p className="mt-1 text-sm text-cream/70">
            Cliente: {cita.cliente?.nombre ?? "Cliente no registrado"}{" "}
            {cita.cliente?.celular ? `· ${cita.cliente.celular}` : ""}
            {cita.esPresencial && (
              <span className="ml-1 text-xs uppercase tracking-wide text-brass/70">
                · presencial
              </span>
            )}
          </p>
          {cita.adicionales.length > 0 && (
            <p className="mt-1 text-sm text-cream/50">
              Adicionales: {cita.adicionales.map((a) => a.adicional.nombre).join(", ")}
            </p>
          )}
        </div>
        <p className="text-xs uppercase tracking-wide text-cream/50">
          {ESTADO_LABEL[cita.estado] ?? cita.estado}
        </p>
      </div>

      {cita.estado === "COMPLETADA" && cita.calificacionEstrellas !== null && (
        <div className="mt-3 border-t border-ink-border pt-3">
          <div className="flex gap-0.5 text-lg leading-none">
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                className={cn(n <= cita.calificacionEstrellas! ? "text-brass" : "text-ink-border-2")}
              >
                ★
              </span>
            ))}
          </div>
          {cita.calificacionComentario && (
            <p className="mt-1 text-xs text-cream/60">&ldquo;{cita.calificacionComentario}&rdquo;</p>
          )}
        </div>
      )}

      {children}
    </div>
  );
}

export default async function PanelBarberoPage() {
  const session = await auth();
  if (!session?.user || session.user.rol !== "BARBERO") redirect("/cuenta");

  const barbero = await prisma.barbero.findUnique({ where: { userId: session.user.id } });
  if (!barbero) redirect("/cuenta");

  const citas = await prisma.cita.findMany({
    where: { barberoId: barbero.id },
    include: {
      corte: true,
      cliente: true,
      adicionales: { include: { adicional: true } },
    },
    orderBy: [{ fecha: "asc" }, { horaInicio: "asc" }],
  });

  const calificadas = citas.filter((c) => c.calificacionEstrellas !== null);
  const promedioCalificacion =
    calificadas.length > 0
      ? calificadas.reduce((suma, c) => suma + c.calificacionEstrellas!, 0) / calificadas.length
      : null;

  const pendientes = citas.filter((c) => c.estadoBarbero === "PENDIENTE");
  const confirmadas = citas.filter((c) => c.estado === "CONFIRMADA");
  const historial = citas
    .filter((c) => c.estado === "COMPLETADA" || c.estado === "NO_SHOW" || c.estado === "CANCELADA")
    .sort((a, b) => b.fecha.getTime() - a.fecha.getTime() || b.horaInicio.localeCompare(a.horaInicio))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-ink px-6 py-16 sm:px-[6vw]">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-brass">Panel de barbero</p>
            <h1 className="mt-2 font-display text-4xl uppercase text-cream">
              Hola, {session.user.name}
            </h1>
            {promedioCalificacion !== null && (
              <p className="mt-1 text-sm text-cream/60">
                Tu calificación:{" "}
                <span className="font-bold text-brass">
                  {promedioCalificacion.toFixed(1)} ★
                </span>{" "}
                ({calificadas.length} {calificadas.length === 1 ? "reseña" : "reseñas"})
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Link
              href="/barbero/servicio"
              className="rounded-full bg-brass px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink transition-colors hover:bg-brass-hover"
            >
              Agregar servicio
            </Link>
            <Link
              href="/barbero/agenda"
              className="rounded-full border border-ink-border-2 px-4 py-2 text-xs font-bold uppercase tracking-wide text-cream transition-colors hover:border-brass hover:text-brass"
            >
              Mi agenda
            </Link>
            <Link
              href="/barbero/horario"
              className="rounded-full border border-ink-border-2 px-4 py-2 text-xs font-bold uppercase tracking-wide text-cream transition-colors hover:border-brass hover:text-brass"
            >
              Mi horario
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="rounded-full border border-ink-border-2 px-4 py-2 text-xs font-bold uppercase tracking-wide text-cream transition-colors hover:border-brass hover:text-brass"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>

        <section className="mt-10">
          <h2 className="font-display text-2xl uppercase text-cream">
            Pendientes de tu respuesta
          </h2>
          {pendientes.length === 0 && (
            <p className="mt-3 text-sm text-cream/50">No tienes solicitudes pendientes.</p>
          )}
          <div className="mt-4 flex flex-col gap-4">
            {pendientes.map((cita) => (
              <CitaCard key={cita.id} cita={cita}>
                <AccionesPendiente citaId={cita.id} />
              </CitaCard>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl uppercase text-cream">Próximas citas confirmadas</h2>
          {confirmadas.length === 0 && (
            <p className="mt-3 text-sm text-cream/50">No tienes citas confirmadas todavía.</p>
          )}
          <div className="mt-4 flex flex-col gap-4">
            {confirmadas.map((cita) => (
              <CitaCard key={cita.id} cita={cita}>
                <AccionesConfirmada citaId={cita.id} esPresencial={cita.esPresencial} />
              </CitaCard>
            ))}
          </div>
        </section>

        {historial.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-2xl uppercase text-cream">Historial reciente</h2>
            <div className="mt-4 flex flex-col gap-4">
              {historial.map((cita) => (
                <CitaCard key={cita.id} cita={cita} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
