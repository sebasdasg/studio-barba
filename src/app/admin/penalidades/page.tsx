import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MarcarAplicadaBoton } from "./marcar-aplicada-boton";

function estadoVisual(estado: string, saldoPendiente: number) {
  if (estado === "APLICADA") {
    return { etiqueta: "Cobrada", clase: "bg-brass text-ink" };
  }
  if (saldoPendiente <= 0) {
    return { etiqueta: "Cubierta por adelanto", clase: "border border-ink-border-2 text-cream/50" };
  }
  return { etiqueta: "Pendiente de cobro", clase: "border border-brass text-brass" };
}

export default async function AdminPenalidadesPage() {
  const session = await auth();
  if (!session?.user || session.user.rol !== "ADMIN") redirect("/cuenta");

  const penalidades = await prisma.penalidad.findMany({
    include: {
      citaOrigen: { include: { cliente: true, corte: true } },
      citaDestino: { include: { corte: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-ink px-6 py-16 sm:px-[6vw]">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-4xl uppercase text-cream">Penalidades</h1>
          <Link href="/admin" className="text-sm text-cream/60 hover:text-brass">
            Volver al panel
          </Link>
        </div>

        {penalidades.length === 0 && (
          <p className="mt-10 text-cream/60">No hay penalidades registradas.</p>
        )}

        <div className="mt-8 flex flex-col gap-4">
          {penalidades.map((p) => {
            const saldo = Number(p.saldoPendiente);
            const { etiqueta, clase } = estadoVisual(p.estado, saldo);
            return (
            <div key={p.id} className="rounded border border-ink-border-2 px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-xl uppercase text-cream">
                    {p.citaOrigen.cliente?.nombre ?? "Cliente no registrado"}
                  </p>
                  <p className="mt-1 text-sm text-cream/70">
                    Cancelación de {p.citaOrigen.corte.nombre} ·{" "}
                    {new Date(p.citaOrigen.fecha).toLocaleDateString("es-PE", {
                      day: "numeric",
                      month: "long",
                      timeZone: "UTC",
                    })}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${clase}`}
                >
                  {etiqueta}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-cream/70 sm:grid-cols-3">
                <p>
                  Penalidad: <span className="text-cream">S/ {Number(p.montoPenalidad).toFixed(2)}</span>
                </p>
                <p>
                  Descontado de adelanto:{" "}
                  <span className="text-cream">S/ {Number(p.montoDescontadoAdelanto).toFixed(2)}</span>
                </p>
                <p>
                  Saldo pendiente:{" "}
                  <span className="text-cream">S/ {Number(p.saldoPendiente).toFixed(2)}</span>
                </p>
              </div>

              {p.citaDestino && (
                <p className="mt-2 text-xs text-cream/50">
                  Vinculada a la reserva de {p.citaDestino.corte.nombre} del{" "}
                  {new Date(p.citaDestino.fecha).toLocaleDateString("es-PE", {
                    day: "numeric",
                    month: "long",
                    timeZone: "UTC",
                  })}
                </p>
              )}

              {p.estado === "PENDIENTE" && saldo > 0 && (
                <div className="mt-3 flex justify-end">
                  <MarcarAplicadaBoton penalidadId={p.id} />
                </div>
              )}
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
