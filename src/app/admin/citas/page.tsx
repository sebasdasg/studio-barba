import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AsignarBarberoForm } from "./asignar-barbero-form";

export default async function AdminCitasPage() {
  const session = await auth();
  if (!session?.user || session.user.rol !== "ADMIN") redirect("/cuenta");

  const [citas, barberos] = await Promise.all([
    prisma.cita.findMany({
      where: { estado: "REQUIERE_ADMIN" },
      include: { cliente: true, corte: true },
      orderBy: [{ fecha: "asc" }, { horaInicio: "asc" }],
    }),
    prisma.barbero.findMany({
      where: { activo: true },
      include: { user: true, cortes: true },
    }),
  ]);

  return (
    <div className="min-h-screen bg-ink px-6 py-16 sm:px-[6vw]">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-4xl uppercase text-cream">
            Citas que requieren atención
          </h1>
          <Link href="/admin" className="text-sm text-cream/60 hover:text-brass">
            Volver al panel
          </Link>
        </div>
        <p className="mt-2 text-sm text-cream/60">
          Ningún barbero aceptó, o no quedó a quién ofrecérsela. Asígnala manualmente.
        </p>

        {citas.length === 0 && (
          <p className="mt-10 text-cream/60">No hay citas pendientes de asignación.</p>
        )}

        <div className="mt-8 flex flex-col gap-4">
          {citas.map((cita) => {
            const candidatos = barberos
              .filter((b) => b.cortes.some((bc) => bc.corteId === cita.corteId))
              .map((b) => ({ id: b.id, nombre: b.user.nombre }));

            return (
              <div key={cita.id} className="rounded border border-ink-border-2 px-5 py-4">
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
                  Cliente: {cita.cliente?.nombre ?? "Cliente no registrado"}
                  {cita.cliente?.celular ? ` · ${cita.cliente.celular}` : ""}
                </p>

                {candidatos.length === 0 ? (
                  <p className="mt-3 text-sm text-red-400">
                    Ningún barbero activo hace este corte.
                  </p>
                ) : (
                  <AsignarBarberoForm citaId={cita.id} barberos={candidatos} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
