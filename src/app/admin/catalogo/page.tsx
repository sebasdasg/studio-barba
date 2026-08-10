import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NuevaCategoriaForm } from "./nueva-categoria-form";
import { CategoriaItem } from "./categoria-item";
import { NuevoCorteForm } from "./nuevo-corte-form";
import { EditarCorteForm } from "./editar-corte-form";

export default async function AdminCatalogoPage() {
  const session = await auth();
  if (!session?.user || session.user.rol !== "ADMIN") redirect("/cuenta");

  const [categorias, cortes] = await Promise.all([
    prisma.categoriaCorte.findMany({ orderBy: { orden: "asc" } }),
    prisma.corte.findMany({ orderBy: { nombre: "asc" } }),
  ]);

  const categoriasOpciones = categorias.map((c) => ({ id: c.id, nombre: c.nombre }));

  return (
    <div className="min-h-screen bg-ink px-6 py-16 sm:px-[6vw]">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-4xl uppercase text-cream">Catálogo y precios</h1>
          <Link href="/admin" className="text-sm text-cream/60 hover:text-brass">
            Volver al panel
          </Link>
        </div>

        <p className="mt-10 text-xs uppercase tracking-wide text-cream/50">Categorías</p>
        <div className="mt-3 flex flex-col gap-2">
          {categorias.map((c) => (
            <CategoriaItem
              key={c.id}
              categoriaId={c.id}
              nombreInicial={c.nombre}
              ordenInicial={c.orden}
              activoInicial={c.activo}
            />
          ))}
        </div>
        <div className="mt-4">
          <NuevaCategoriaForm />
        </div>

        <p className="mt-10 text-xs uppercase tracking-wide text-cream/50">Cortes</p>
        <div className="mt-3">
          <NuevoCorteForm categorias={categoriasOpciones} />
        </div>
        <div className="mt-4 flex flex-col gap-4">
          {cortes.map((c) => (
            <EditarCorteForm
              key={c.id}
              corteId={c.id}
              nombreInicial={c.nombre}
              descripcionInicial={c.descripcion}
              precioInicial={Number(c.precio)}
              fotoUrlInicial={c.fotoUrl}
              categoriaCorteIdInicial={c.categoriaCorteId}
              activoInicial={c.activo}
              categorias={categoriasOpciones}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
