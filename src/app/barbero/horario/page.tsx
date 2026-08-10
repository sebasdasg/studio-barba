import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { HorarioBarberoDia } from "@/components/horario-barbero-dia";
import { guardarMiHorarioDia } from "@/lib/reservas/horario-barbero-actions";

const NOMBRES_DIA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default async function BarberoHorarioPage() {
  const session = await auth();
  if (!session?.user || session.user.rol !== "BARBERO") redirect("/cuenta");

  const barbero = await prisma.barbero.findUnique({ where: { userId: session.user.id } });
  if (!barbero) redirect("/cuenta");

  const [misHorarios, horarioSede] = await Promise.all([
    prisma.barberoHorario.findMany({ where: { barberoId: barbero.id } }),
    prisma.horarioAtencion.findMany({ where: { sedeId: barbero.sedeId } }),
  ]);

  const misPorDia = new Map(misHorarios.map((h) => [h.diaSemana, h]));
  const sedePorDia = new Map(horarioSede.map((h) => [h.diaSemana, h]));

  return (
    <div className="min-h-screen bg-ink px-6 py-16 sm:px-[6vw]">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-4xl uppercase text-cream">Mi horario</h1>
          <Link href="/barbero" className="text-sm text-cream/60 hover:text-brass">
            Volver a mi panel
          </Link>
        </div>
        <p className="mt-2 text-sm text-cream/60">
          Elige los días que trabajas y tu rango horario cada día. Debe caer dentro del horario
          de atención de la sede. Un turno de 7 horas o más lleva 1 hora de refrigerio,
          calculada automáticamente a la mitad del turno.
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
                  onGuardar={guardarMiHorarioDia}
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
