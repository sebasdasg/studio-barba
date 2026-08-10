import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ReservaWizard } from "./reserva-wizard";
import { obtenerCitaActiva } from "./actions";
import { CitaActivaAlerta } from "./cita-activa-alerta";

// Depende de la sesión de quien visita — sin esto, algunos hosts (Netlify
// entre ellos) pueden prerenderizar y cachear esta página como si fuera
// estática, sirviendo el mismo contenido (o falta de redirección a login)
// a cualquier visitante sin importar su sesión real.
export const dynamic = "force-dynamic";

export default async function ReservarPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const citaActiva = await obtenerCitaActiva();

  if (citaActiva) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink px-6 py-16">
        <CitaActivaAlerta cita={citaActiva} />
      </div>
    );
  }

  const [cortes, adicionales] = await Promise.all([
    prisma.corte.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } }),
    prisma.adicional.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } }),
  ]);

  return (
    <div className="min-h-screen bg-ink px-6 py-16 sm:px-[6vw]">
      <ReservaWizard
        cortes={cortes.map((c) => ({
          id: c.id,
          nombre: c.nombre,
          precio: Number(c.precio),
          descripcion: c.descripcion,
          fotoUrl: c.fotoUrl,
        }))}
        adicionales={adicionales.map((a) => ({
          id: a.id,
          nombre: a.nombre,
          precio: Number(a.precio),
        }))}
      />
    </div>
  );
}
