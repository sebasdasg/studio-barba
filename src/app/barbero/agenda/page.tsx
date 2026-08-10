import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

const ESTADO_LABEL: Record<string, string> = {
  RESERVADA: "Pendiente de aceptar",
  CONFIRMADA: "Confirmada",
  REQUIERE_ADMIN: "En revisión por el local",
  COMPLETADA: "Completada",
  NO_SHOW: "No asistió",
  REPROGRAMADA: "Reprogramada",
};

export default async function AgendaBarberoPage() {
  const session = await auth();
  if (!session?.user || session.user.rol !== "BARBERO") redirect("/cuenta");

  const barbero = await prisma.barbero.findUnique({ where: { userId: session.user.id } });
  if (!barbero) redirect("/cuenta");

  const citas = await prisma.cita.findMany({
    // Las canceladas no son un compromiso real en la agenda — quedan
    // registradas en el historial del panel principal, no acá.
    where: { barberoId: barbero.id, estado: { not: "CANCELADA" } },
    include: {
      corte: true,
      cliente: true,
      adicionales: { include: { adicional: true } },
    },
    orderBy: [{ fecha: "asc" }, { horaInicio: "asc" }],
  });

  const grupos = new Map<string, typeof citas>();
  for (const cita of citas) {
    const clave = cita.fecha.toISOString().slice(0, 10);
    const grupo = grupos.get(clave);
    if (grupo) grupo.push(cita);
    else grupos.set(clave, [cita]);
  }

  return (
    <div className="min-h-screen bg-ink px-6 py-16 sm:px-[6vw]">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-4xl uppercase text-cream">Mi agenda</h1>
          <Link href="/barbero" className="text-sm text-cream/60 hover:text-brass">
            Volver al panel
          </Link>
        </div>

        {citas.length === 0 && (
          <p className="mt-10 text-cream/60">No tienes citas agendadas.</p>
        )}

        <div className="mt-8 flex flex-col gap-10">
          {[...grupos.entries()].map(([fechaISO, citasDelDia]) => (
            <section key={fechaISO}>
              <h2 className="font-display text-xl uppercase text-brass">
                {new Date(`${fechaISO}T00:00:00Z`).toLocaleDateString("es-PE", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  timeZone: "UTC",
                })}
              </h2>
              <div className="mt-3 flex flex-col gap-3">
                {citasDelDia.map((cita) => (
                  <div
                    key={cita.id}
                    className="flex items-start justify-between gap-4 rounded border border-ink-border-2 px-5 py-4"
                  >
                    <div>
                      <p className="font-display text-lg uppercase text-cream">
                        {cita.horaInicio} · {cita.corte.nombre}
                      </p>
                      <p className="mt-1 text-sm text-cream/70">
                        Cliente: {cita.cliente?.nombre ?? "Cliente no registrado"}
                        {cita.cliente?.celular ? ` · ${cita.cliente.celular}` : ""}
                      </p>
                      {cita.adicionales.length > 0 && (
                        <p className="mt-1 text-sm text-cream/50">
                          Adicionales: {cita.adicionales.map((a) => a.adicional.nombre).join(", ")}
                        </p>
                      )}
                    </div>
                    <p className="whitespace-nowrap text-xs uppercase tracking-wide text-cream/50">
                      {ESTADO_LABEL[cita.estado] ?? cita.estado}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
