import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ValidarPagoBotones } from "./validar-pago-botones";

export default async function AdminPagosPage() {
  const session = await auth();
  if (!session?.user || session.user.rol !== "ADMIN") redirect("/cuenta");

  const pagos = await prisma.pago.findMany({
    where: { estado: "PENDIENTE_VALIDACION" },
    include: {
      cita: {
        include: { cliente: true, corte: true, barbero: { include: { user: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="min-h-screen bg-ink px-6 py-16 sm:px-[6vw]">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-4xl uppercase text-cream">
            Comprobantes por validar
          </h1>
          <Link href="/admin" className="text-sm text-cream/60 hover:text-brass">
            Volver al panel
          </Link>
        </div>

        {pagos.length === 0 && (
          <p className="mt-10 text-cream/60">No hay comprobantes pendientes.</p>
        )}

        <div className="mt-8 flex flex-col gap-6">
          {pagos.map((pago) => (
            <div key={pago.id} className="rounded border border-ink-border-2 p-5">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="relative h-48 w-full shrink-0 overflow-hidden rounded border border-ink-border-2 bg-ink-2 sm:w-40">
                  {/* Imagen dinámica autenticada — no es un asset estático,
                      por eso no usa next/image acá. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/admin/pagos/${pago.id}/comprobante`}
                    alt="Comprobante de pago"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-display text-xl uppercase text-cream">
                    {pago.cita.corte.nombre}
                  </p>
                  <p className="mt-1 text-sm text-cream/70">
                    Cliente: {pago.cita.cliente?.nombre ?? "Cliente no registrado"}
                    {pago.cita.cliente?.celular ? ` · ${pago.cita.cliente.celular}` : ""}
                  </p>
                  <p className="mt-1 text-sm text-cream/70">
                    Barbero: {pago.cita.barbero?.user.nombre ?? "—"}
                  </p>
                  <p className="mt-1 text-sm text-cream/70">
                    {new Date(pago.cita.fecha).toLocaleDateString("es-PE", {
                      day: "numeric",
                      month: "long",
                      timeZone: "UTC",
                    })}{" "}
                    · {pago.cita.horaInicio}
                  </p>
                  <p className="mt-2 text-sm text-cream/80">
                    Tipo:{" "}
                    <strong className="text-cream">
                      {pago.tipo === "ADELANTO" ? "Adelanto" : "Pago total"}
                    </strong>{" "}
                    · Monto: <strong className="text-brass">S/ {Number(pago.monto)}</strong>
                  </p>

                  <ValidarPagoBotones pagoId={pago.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
