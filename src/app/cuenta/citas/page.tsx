import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { CancelarCitaBoton } from "@/components/cancelar-cita-boton";
import { esEstadoActivo } from "@/lib/reservas/cancelacion";
import { SubirComprobanteForm } from "./subir-comprobante-form";
import { CalificarForm } from "./calificar-form";

const ESTADO_LABEL: Record<string, string> = {
  RESERVADA: "Reservada",
  CONFIRMADA: "Confirmada",
  REQUIERE_ADMIN: "En revisión",
  COMPLETADA: "Completada",
  NO_SHOW: "No asistió",
  CANCELADA: "Cancelada",
  REPROGRAMADA: "Reprogramada",
};

const ESTADO_BARBERO_BADGE: Record<string, { texto: string; clase: string }> = {
  PENDIENTE: {
    texto: "Esperando confirmación del barbero",
    clase: "border border-ink-border-2 text-cream/80",
  },
  ACEPTADA: { texto: "Barbero confirmó", clase: "bg-brass text-ink" },
  RECHAZADA: { texto: "Barbero rechazó", clase: "border border-red-400/50 text-red-400" },
  ASIGNADA_POR_ADMIN: { texto: "Confirmada por el local", clase: "bg-brass text-ink" },
};

const ESTADO_PAGO_LABEL: Record<string, string> = {
  PENDIENTE_VALIDACION: "Comprobante en revisión",
  APROBADO: "Pago aprobado",
  RECHAZADO: "Comprobante rechazado — sube uno nuevo",
};

export default async function MisCitasPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const citas = await prisma.cita.findMany({
    where: { clienteId: session.user.id },
    include: {
      corte: true,
      barbero: { include: { user: true } },
      adicionales: { include: { adicional: true } },
    },
    orderBy: [{ fecha: "desc" }, { horaInicio: "desc" }],
  });

  const citaActiva = citas.find((c) => esEstadoActivo(c.estado));
  const historial = citas.filter((c) => !esEstadoActivo(c.estado));

  return (
    <div className="min-h-screen bg-ink px-6 py-16 sm:px-[6vw]">
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="font-display text-4xl uppercase text-cream">
            Hola, {session.user.name}
          </h1>
          <div className="flex gap-3">
            <Link
              href="/reservar"
              className="rounded-full bg-brass px-5 py-2.5 text-[13px] font-bold uppercase tracking-[1px] text-ink transition-colors hover:bg-brass-hover"
            >
              Reservar cita
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="rounded-full border border-ink-border-2 px-5 py-2.5 text-[13px] font-bold uppercase tracking-[1px] text-cream transition-colors hover:border-brass hover:text-brass"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>

        {citas.length === 0 && (
          <p className="mt-10 text-cream/60">Todavía no tienes citas reservadas.</p>
        )}

        {citaActiva && (
          <section className="mt-10">
            <h2 className="font-display text-2xl uppercase text-cream">Tu cita</h2>
            <div className="mt-4">
              <CitaCard cita={citaActiva} destacada />
            </div>
          </section>
        )}

        {historial.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-2xl uppercase text-cream">Historial</h2>
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

function CitaCard({
  cita,
  destacada,
}: {
  cita: Awaited<ReturnType<typeof prisma.cita.findMany>>[number] & {
    corte: { nombre: string };
    barbero: { user: { nombre: string } } | null;
    adicionales: { adicional: { nombre: string }; precio: unknown }[];
  };
  destacada?: boolean;
}) {
  const totalAdicionales = cita.adicionales.reduce((s, a) => s + Number(a.precio), 0);
  const total = Number(cita.precioCorte) + totalAdicionales;
  const badge = ESTADO_BARBERO_BADGE[cita.estadoBarbero];

  return (
    <div
      className={cn(
        "rounded border px-5 py-4",
        destacada ? "border-brass" : "border-ink-border-2"
      )}
    >
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
            Barbero: {cita.barbero?.user.nombre ?? "Por asignar"}
          </p>
          {cita.adicionales.length > 0 && (
            <p className="mt-1 text-sm text-cream/50">
              Adicionales: {cita.adicionales.map((a) => a.adicional.nombre).join(", ")}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="font-display text-lg text-brass">S/ {total}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-cream/50">
            {ESTADO_LABEL[cita.estado] ?? cita.estado}
          </p>
        </div>
      </div>

      {esEstadoActivo(cita.estado) && (
        <>
          {badge && (
            <span
              className={cn(
                "mt-3 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
                badge.clase
              )}
            >
              {badge.texto}
            </span>
          )}

          <div className="mt-3 border-t border-ink-border pt-3">
            <CancelarCitaBoton citaId={cita.id} />
          </div>

          {cita.estadoPago === "SIN_COMPROBANTE" || cita.estadoPago === "RECHAZADO" ? (
            <SubirComprobanteForm citaId={cita.id} />
          ) : (
            <p className="mt-3 border-t border-ink-border pt-3 text-xs text-cream/50">
              {ESTADO_PAGO_LABEL[cita.estadoPago] ?? cita.estadoPago}
            </p>
          )}
        </>
      )}

      {cita.estado === "COMPLETADA" &&
        (cita.calificacionEstrellas ? (
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
        ) : (
          <CalificarForm citaId={cita.id} />
        ))}
    </div>
  );
}
