import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { HorarioDia } from "./horario-dia";

const NOMBRES_DIA = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export default async function AdminHorarioPage() {
  const session = await auth();
  if (!session?.user || session.user.rol !== "ADMIN") redirect("/cuenta");

  const sede = await prisma.sede.findFirst({ where: { activo: true } });
  const horarios = sede
    ? await prisma.horarioAtencion.findMany({ where: { sedeId: sede.id } })
    : [];

  const porDia = new Map(horarios.map((h) => [h.diaSemana, h]));

  return (
    <div className="min-h-screen bg-ink px-6 py-16 sm:px-[6vw]">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-4xl uppercase text-cream">Horario de atención</h1>
          <Link href="/admin" className="text-sm text-cream/60 hover:text-brass">
            Volver al panel
          </Link>
        </div>
        <p className="mt-2 text-sm text-cream/60">
          Los días sin horario definido aparecen como cerrados y no ofrecen citas.
        </p>

        {!sede ? (
          <p className="mt-10 text-red-400">No hay una sede activa configurada.</p>
        ) : (
          <div className="mt-8 flex flex-col gap-3">
            {NOMBRES_DIA.map((nombre, diaSemana) => {
              const h = porDia.get(diaSemana);
              return (
                <HorarioDia
                  key={diaSemana}
                  diaSemana={diaSemana}
                  nombreDia={nombre}
                  abiertoInicial={!!h}
                  horaInicioInicial={h?.horaInicio ?? "09:00"}
                  horaFinInicial={h?.horaFin ?? "20:00"}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
