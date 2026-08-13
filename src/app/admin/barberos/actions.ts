"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

type Resultado = { error: string } | { ok: true };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.rol !== "ADMIN") return null;
  return session.user;
}

export type CrearBarberoState = { error?: string; ok?: boolean };

export async function crearBarbero(
  _prevState: CrearBarberoState,
  formData: FormData
): Promise<CrearBarberoState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "No autorizado." };

  const nombre = formData.get("nombre");
  const celular = formData.get("celular");
  const email = formData.get("email");
  const password = formData.get("password");
  const comisionRaw = formData.get("comision");
  const corteIds = formData.getAll("cortes").map(String);

  if (typeof nombre !== "string" || !nombre.trim()) {
    return { error: "Ingresa el nombre." };
  }
  if (typeof celular !== "string" || !/^9\d{8}$/.test(celular)) {
    return { error: "Celular inválido (9 dígitos, empieza con 9)." };
  }
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Ingresa un correo válido." };
  }
  if (typeof password !== "string" || password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }
  const comision = Number(comisionRaw);
  if (!Number.isFinite(comision) || comision < 0 || comision > 100) {
    return { error: "Comisión inválida (0 a 100)." };
  }

  const [existenteCelular, existenteEmail] = await Promise.all([
    prisma.user.findUnique({ where: { celular } }),
    prisma.user.findUnique({ where: { email } }),
  ]);
  if (existenteCelular) return { error: "Ya existe una cuenta con ese celular." };
  if (existenteEmail) return { error: "Ya existe una cuenta con ese correo." };

  const sede = await prisma.sede.findFirst({ where: { activo: true } });
  if (!sede) return { error: "No hay una sede activa configurada." };

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      // Lo crea un admin ya autenticado, no el registro público — el correo
      // no necesita el paso de verificación.
      data: { nombre: nombre.trim(), celular, email, passwordHash, rol: "BARBERO", emailVerified: new Date() },
    });
    const barbero = await tx.barbero.create({
      data: { userId: user.id, sedeId: sede.id, comisionPorcentaje: comision },
    });
    if (corteIds.length > 0) {
      await tx.barberoCorte.createMany({
        data: corteIds.map((corteId) => ({ barberoId: barbero.id, corteId })),
      });
    }
  });

  revalidatePath("/admin/barberos");
  return { ok: true };
}

export async function actualizarBarbero(
  barberoId: string,
  datos: { comisionPorcentaje: number; activo: boolean; corteIds: string[] }
): Promise<Resultado> {
  const admin = await requireAdmin();
  if (!admin) return { error: "No autorizado." };

  if (
    !Number.isFinite(datos.comisionPorcentaje) ||
    datos.comisionPorcentaje < 0 ||
    datos.comisionPorcentaje > 100
  ) {
    return { error: "Comisión inválida." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.barbero.update({
      where: { id: barberoId },
      data: { comisionPorcentaje: datos.comisionPorcentaje, activo: datos.activo },
    });
    await tx.barberoCorte.deleteMany({ where: { barberoId } });
    if (datos.corteIds.length > 0) {
      await tx.barberoCorte.createMany({
        data: datos.corteIds.map((corteId) => ({ barberoId, corteId })),
      });
    }
  });

  revalidatePath("/admin/barberos");
  return { ok: true };
}
