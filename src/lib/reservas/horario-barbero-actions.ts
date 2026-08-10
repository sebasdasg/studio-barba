"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { horaAMinutos } from "./horario";
import { revalidatePath } from "next/cache";

type Resultado = { error: string } | { ok: true };

const HORA_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

async function validarContraSede(
  sedeId: string,
  diaSemana: number,
  horaInicio: string,
  horaFin: string
): Promise<string | null> {
  if (!HORA_REGEX.test(horaInicio) || !HORA_REGEX.test(horaFin)) {
    return "Formato de hora inválido.";
  }
  if (horaAMinutos(horaInicio) >= horaAMinutos(horaFin)) {
    return "La hora de inicio debe ser antes que la de cierre.";
  }
  const horarioSede = await prisma.horarioAtencion.findUnique({
    where: { sedeId_diaSemana: { sedeId, diaSemana } },
  });
  if (!horarioSede) return "Ese día la sede está cerrada.";
  if (
    horaAMinutos(horaInicio) < horaAMinutos(horarioSede.horaInicio) ||
    horaAMinutos(horaFin) > horaAMinutos(horarioSede.horaFin)
  ) {
    return `Ese día la sede atiende de ${horarioSede.horaInicio} a ${horarioSede.horaFin}.`;
  }
  return null;
}

async function guardarHorarioBarbero(
  barberoId: string,
  sedeId: string,
  diaSemana: number,
  datos: { trabaja: boolean; horaInicio: string; horaFin: string }
): Promise<Resultado> {
  if (diaSemana < 0 || diaSemana > 6) return { error: "Día inválido." };

  if (!datos.trabaja) {
    await prisma.barberoHorario.deleteMany({ where: { barberoId, diaSemana } });
    return { ok: true };
  }

  const error = await validarContraSede(sedeId, diaSemana, datos.horaInicio, datos.horaFin);
  if (error) return { error };

  await prisma.barberoHorario.upsert({
    where: { barberoId_diaSemana: { barberoId, diaSemana } },
    update: { horaInicio: datos.horaInicio, horaFin: datos.horaFin },
    create: { barberoId, diaSemana, horaInicio: datos.horaInicio, horaFin: datos.horaFin },
  });
  return { ok: true };
}

export async function guardarMiHorarioDia(
  diaSemana: number,
  datos: { trabaja: boolean; horaInicio: string; horaFin: string }
): Promise<Resultado> {
  const session = await auth();
  if (!session?.user || session.user.rol !== "BARBERO") return { error: "No autorizado." };

  const barbero = await prisma.barbero.findUnique({ where: { userId: session.user.id } });
  if (!barbero) return { error: "No autorizado." };

  const resultado = await guardarHorarioBarbero(barbero.id, barbero.sedeId, diaSemana, datos);
  if ("ok" in resultado) revalidatePath("/barbero/horario");
  return resultado;
}

export async function guardarHorarioBarberoAdmin(
  barberoId: string,
  diaSemana: number,
  datos: { trabaja: boolean; horaInicio: string; horaFin: string }
): Promise<Resultado> {
  const session = await auth();
  if (!session?.user || session.user.rol !== "ADMIN") return { error: "No autorizado." };

  const barbero = await prisma.barbero.findUnique({ where: { id: barberoId } });
  if (!barbero) return { error: "Barbero no encontrado." };

  const resultado = await guardarHorarioBarbero(barbero.id, barbero.sedeId, diaSemana, datos);
  if ("ok" in resultado) revalidatePath(`/admin/barberos/${barberoId}/horario`);
  return resultado;
}
