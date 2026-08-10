import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { HorarioBarberoDia } from "@/components/horario-barbero-dia";
import { guardarHorarioBarberoAdmin } from "@/lib/reservas/horario-barbero-actions";

const NOMBRES_DIA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default async function AdminHorarioBarberoPage({
  params,
}: {
  params: Promise<{ barberoId: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.rol !== "ADMIN") redirect("/cuenta");

  const { barberoId } = await params;
  const barbero = await prisma.barbero.findUnique({
    where: { id: barberoId },
    include: { user: true },
  });
  if (!barbero) notFound();

  const [misHorarios, horarioSede] = await Promise.all([
    prisma.barberoHorario.findMany({ where: { barberoId: barbero.id } }),
    prisma.horarioAtencion.findMany({ where: { sedeId: barbero.sedeId } }),
  ]);

  const misPorDia = new Map(misHorarios.map((h) => [h.diaSemana, h]));
  const sedePorDia = new Map(horarioSede.map((h) => [h.diaSemana, h]));

  const guardarDia = guardarHorarioBarberoAdmin.bind(null, barbero.id);

  return (
    <div className="min-h-screen bg-ink px-6 py-16 sm:px-[6vw]">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-4xl uppercase text-cream">
            Horario de {barbero.user.nombre}
          </h1>
          <Link href="/admin/barberos" className="text-sm text-cream/60 hover:text-brass">
            Volver a barberos
          </Link>
        </div>
        <p className="mt-2 text-sm text-cream/60">
          Ajuste de último momento. Normalmente cada barbero configura su propio horario desde
          su panel.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          {NOMBRES_DIA.map((nombre, diaSemana) => {
            const mio = misPorDia.get(diaSemana);
            const sede = sedePorDia.get(diaSemana);
            return (
              <div key={diaSemana}>
                <HorarioBarberoDia
                  diaSemana={diaSemana}
                  nombreDia={nombre}
                  trabajaInicial={!!mio}
                  horaInicioInicial={mio?.horaInicio ?? sede?.horaInicio ?? "09:00"}
                  horaFinInicial={mio?.horaFin ?? sede?.horaFin ?? "20:00"}
                  onGuardar={guardarDia}
                />
                {!sede && (
                  <p className="mt-1 pl-1 text-xs text-cream/40">
                    La sede no atiende los {nombre.toLowerCase()}.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
