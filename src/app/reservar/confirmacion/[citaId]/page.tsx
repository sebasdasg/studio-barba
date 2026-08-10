import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function ConfirmacionReservaPage({
  params,
}: {
  params: Promise<{ citaId: string }>;
}) {
  const { citaId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const cita = await prisma.cita.findUnique({
    where: { id: citaId },
    include: {
      corte: true,
      barbero: { include: { user: true } },
      adicionales: { include: { adicional: true } },
    },
  });

  if (!cita || cita.clienteId !== session.user.id) notFound();

  const totalAdicionales = cita.adicionales.reduce((s, a) => s + Number(a.precio), 0);
  const total = Number(cita.precioCorte) + totalAdicionales;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ink px-6 py-16 text-center">
      <div>
        <p className="text-xs uppercase tracking-widest text-brass">Reserva creada</p>
        <h1 className="mt-2 font-display text-4xl uppercase text-cream">
          {cita.corte.nombre}
        </h1>
        <p className="mt-2 text-cream/70">
          {new Date(cita.fecha).toLocaleDateString("es-PE", {
            weekday: "long",
            day: "numeric",
            month: "long",
            timeZone: "UTC",
          })}{" "}
          · {cita.horaInicio}
        </p>
        <p className="mt-1 text-cream/70">Barbero: {cita.barbero?.user.nombre ?? "—"}</p>
        <p className="mt-1 font-display text-2xl text-brass">S/ {total}</p>

        <div className="mx-auto mt-6 max-w-sm rounded border border-ink-border-2 px-5 py-4 text-sm text-cream/70">
          Tu barbero tiene hasta <strong className="text-cream">15 minutos</strong> para
          aceptar la cita. Te avisaremos apenas confirme. Puedes subir tu comprobante de
          pago (Yape/Plin) cuando quieras desde <strong className="text-cream">Mis citas</strong>.
        </div>
      </div>

      <Link
        href="/cuenta/citas"
        className="rounded-full bg-brass px-6 py-3 text-[13px] font-bold uppercase tracking-[1px] text-ink transition-colors hover:bg-brass-hover"
      >
        Ver mis citas
      </Link>
    </div>
  );
}
