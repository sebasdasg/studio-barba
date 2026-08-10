"use server";

import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

type Resultado = { error: string } | { ok: true };

const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024;

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.rol !== "ADMIN") return null;
  return session.user;
}

async function subirFotoCorte(archivo: File): Promise<{ url: string } | { error: string }> {
  if (!archivo.type.startsWith("image/")) {
    return { error: "La foto debe ser una imagen." };
  }
  if (archivo.size > TAMANO_MAXIMO_BYTES) {
    return { error: "La imagen no puede pesar más de 5 MB." };
  }
  const extension = archivo.name.split(".").pop() || "jpg";
  try {
    const blob = await put(`cortes/${Date.now()}.${extension}`, archivo, {
      access: "public",
      addRandomSuffix: true,
      token: process.env.BLOB_READ_WRITE_TOKEN_FOTOS,
    });
    return { url: blob.url };
  } catch (err) {
    console.error("Error subiendo foto de corte a Vercel Blob:", err);
    return { error: "No se pudo subir la foto. Intenta de nuevo." };
  }
}

// ── Categorías ──────────────────────────────────────────────

export type CrearCategoriaState = { error?: string; ok?: boolean };

export async function crearCategoria(
  _prevState: CrearCategoriaState,
  formData: FormData
): Promise<CrearCategoriaState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "No autorizado." };

  const nombre = formData.get("nombre");
  if (typeof nombre !== "string" || !nombre.trim()) {
    return { error: "Ingresa el nombre de la categoría." };
  }

  const ultima = await prisma.categoriaCorte.findFirst({ orderBy: { orden: "desc" } });
  await prisma.categoriaCorte.create({
    data: { nombre: nombre.trim(), orden: (ultima?.orden ?? -1) + 1 },
  });

  revalidatePath("/admin/catalogo");
  return { ok: true };
}

export async function actualizarCategoria(
  categoriaId: string,
  datos: { nombre: string; orden: number; activo: boolean }
): Promise<Resultado> {
  const admin = await requireAdmin();
  if (!admin) return { error: "No autorizado." };

  if (!datos.nombre.trim()) return { error: "El nombre no puede estar vacío." };
  if (!Number.isFinite(datos.orden)) return { error: "Orden inválido." };

  await prisma.categoriaCorte.update({
    where: { id: categoriaId },
    data: { nombre: datos.nombre.trim(), orden: datos.orden, activo: datos.activo },
  });

  revalidatePath("/admin/catalogo");
  revalidatePath("/");
  return { ok: true };
}

// ── Cortes ──────────────────────────────────────────────────

export type CrearCorteState = { error?: string; ok?: boolean };

export async function crearCorte(
  _prevState: CrearCorteState,
  formData: FormData
): Promise<CrearCorteState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "No autorizado." };

  const nombre = formData.get("nombre");
  const descripcion = formData.get("descripcion");
  const precioRaw = formData.get("precio");
  const categoriaCorteIdRaw = formData.get("categoriaCorteId");
  const foto = formData.get("foto");

  if (typeof nombre !== "string" || !nombre.trim()) {
    return { error: "Ingresa el nombre del corte." };
  }
  if (typeof descripcion !== "string" || !descripcion.trim()) {
    return { error: "Ingresa una descripción." };
  }
  const precio = Number(precioRaw);
  if (!Number.isFinite(precio) || precio <= 0) {
    return { error: "Precio inválido." };
  }

  let fotoUrl: string | null = null;
  if (foto instanceof File && foto.size > 0) {
    const resultado = await subirFotoCorte(foto);
    if ("error" in resultado) return { error: resultado.error };
    fotoUrl = resultado.url;
  }

  const categoriaCorteId =
    typeof categoriaCorteIdRaw === "string" && categoriaCorteIdRaw !== ""
      ? categoriaCorteIdRaw
      : null;

  await prisma.corte.create({
    data: {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      precio,
      fotoUrl,
      categoria: "moderno",
      categoriaCorteId,
    },
  });

  revalidatePath("/admin/catalogo");
  revalidatePath("/");
  return { ok: true };
}

export type ActualizarCorteState = { error?: string; ok?: boolean };

export async function actualizarCorte(
  _prevState: ActualizarCorteState,
  formData: FormData
): Promise<ActualizarCorteState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "No autorizado." };

  const corteId = formData.get("corteId");
  const nombre = formData.get("nombre");
  const descripcion = formData.get("descripcion");
  const precioRaw = formData.get("precio");
  const categoriaCorteIdRaw = formData.get("categoriaCorteId");
  const activo = formData.get("activo") === "on";
  const foto = formData.get("foto");

  if (typeof corteId !== "string") return { error: "Corte inválido." };
  if (typeof nombre !== "string" || !nombre.trim()) {
    return { error: "Ingresa el nombre del corte." };
  }
  if (typeof descripcion !== "string" || !descripcion.trim()) {
    return { error: "Ingresa una descripción." };
  }
  const precio = Number(precioRaw);
  if (!Number.isFinite(precio) || precio <= 0) {
    return { error: "Precio inválido." };
  }

  let fotoUrl: string | undefined;
  if (foto instanceof File && foto.size > 0) {
    const resultado = await subirFotoCorte(foto);
    if ("error" in resultado) return { error: resultado.error };
    fotoUrl = resultado.url;
  }

  const categoriaCorteId =
    typeof categoriaCorteIdRaw === "string" && categoriaCorteIdRaw !== ""
      ? categoriaCorteIdRaw
      : null;

  await prisma.corte.update({
    where: { id: corteId },
    data: {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      precio,
      categoriaCorteId,
      activo,
      ...(fotoUrl ? { fotoUrl } : {}),
    },
  });

  revalidatePath("/admin/catalogo");
  revalidatePath("/");
  return { ok: true };
}
