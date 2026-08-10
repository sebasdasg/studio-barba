import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ServicioForm } from "./servicio-form";

export default async function BarberoServicioPage() {
  const session = await auth();
  if (!session?.user || session.user.rol !== "BARBERO") redirect("/cuenta");

  const barbero = await prisma.barbero.findUnique({ where: { userId: session.user.id } });
  if (!barbero) redirect("/cuenta");

  const [cortesRelacion, adicionales] = await Promise.all([
    prisma.barberoCorte.findMany({
      where: { barberoId: barbero.id, corte: { activo: true } },
      include: { corte: true },
      orderBy: { corte: { nombre: "asc" } },
    }),
    prisma.adicional.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } }),
  ]);

  const cortes = cortesRelacion.map((r) => ({
    id: r.corte.id,
    nombre: r.corte.nombre,
    precio: Number(r.corte.precio),
    descripcion: r.corte.descripcion,
    fotoUrl: r.corte.fotoUrl,
  }));
  const adicionalesOpciones = adicionales.map((a) => ({
    id: a.id,
    nombre: a.nombre,
    precio: Number(a.precio),
  }));

  return (
    <div className="min-h-screen bg-ink px-6 py-16 sm:px-[6vw]">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-4xl uppercase text-cream">Agregar servicio</h1>
          <Link href="/barbero" className="text-sm text-cream/60 hover:text-brass">
            Volver a mi panel
          </Link>
        </div>
        <p className="mt-2 text-sm text-cream/60">
          Para un cliente que llega directo a la barbería, sin reserva previa. Al registrar el
          servicio se bloquea tu horario de inmediato.
        </p>

        <div className="mt-8">
          <ServicioForm cortes={cortes} adicionales={adicionalesOpciones} />
        </div>
      </div>
    </div>
  );
}
