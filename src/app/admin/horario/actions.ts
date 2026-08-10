"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { horaAMinutos } from "@/lib/reservas/horario";
import { revalidatePath } from "next/cache";

type Resultado = { error: string } | { ok: true };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.rol !== "ADMIN") return null;
  return session.user;
}

const HORA_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export async function guardarHorarioDia(
  diaSemana: number,
  datos: { abierto: boolean; horaInicio: string; horaFin: string }
): Promise<Resultado> {
  const admin = await requireAdmin();
  if (!admin) return { error: "No autorizado." };

  if (diaSemana < 0 || diaSemana > 6) return { error: "Día inválido." };

  const sede = await prisma.sede.findFirst({ where: { activo: true } });
  if (!sede) return { error: "No hay una sede activa configurada." };

  if (!datos.abierto) {
    await prisma.horarioAtencion.deleteMany({
      where: { sedeId: sede.id, diaSemana },
    });
    revalidatePath("/admin/horario");
    return { ok: true };
  }

  if (!HORA_REGEX.test(datos.horaInicio) || !HORA_REGEX.test(datos.horaFin)) {
    return { error: "Formato de hora inválido." };
  }
  if (horaAMinutos(datos.horaInicio) >= horaAMinutos(datos.horaFin)) {
    return { error: "La hora de inicio debe ser antes que la de cierre." };
  }

  await prisma.horarioAtencion.upsert({
    where: { sedeId_diaSemana: { sedeId: sede.id, diaSemana } },
    update: { horaInicio: datos.horaInicio, horaFin: datos.horaFin },
    create: {
      sedeId: sede.id,
      diaSemana,
      horaInicio: datos.horaInicio,
      horaFin: datos.horaFin,
    },
  });

  revalidatePath("/admin/horario");
  return { ok: true };
}
