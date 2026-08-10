import { prisma } from "@/lib/prisma";
import { PhotoBox } from "./photo-box";

type CorteVista = {
  id: string;
  nombre: string;
  precio: number;
  descripcion: string;
  fotoUrl: string | null;
};

function TarjetaCorte({ corte }: { corte: CorteVista }) {
  return (
    <article className="group">
      <div className="relative overflow-hidden rounded">
        <PhotoBox
          src={corte.fotoUrl ?? undefined}
          alt={corte.nombre}
          label={`Foto pendiente: ${corte.nombre}`}
          aspect="4/5"
          imgClassName="transition-transform duration-500 ease-out group-hover:scale-[1.06]"
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,oklch(15%_0.015_55/0.85)_0%,transparent_55%)]" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
          <h3 className="font-display text-2xl text-cream">{corte.nombre}</h3>
          <span className="text-[13px] font-bold text-brass">S/ {corte.precio}</span>
        </div>
      </div>
      <p className="mt-3 text-[14.5px] text-cream/75">{corte.descripcion}</p>
    </article>
  );
}

// Server Component async: lee el catálogo en vivo de la base (antes era un
// archivo estático) para que lo que edite el admin se refleje acá. Si hay
// categorías cargadas (CategoriaCorte), se agrupa por categoría; si no,
// se muestra como una sola grilla — así no cambia nada visualmente hasta
// que el admin defina categorías reales.
export async function Catalogo() {
  const cortesDb = await prisma.corte.findMany({
    where: { activo: true },
    include: { categoriaCorte: true },
    orderBy: { nombre: "asc" },
  });

  const gruposMap = new Map<
    string,
    { nombre: string; orden: number; cortes: CorteVista[] }
  >();
  const sinCategoria: CorteVista[] = [];

  for (const c of cortesDb) {
    const corte: CorteVista = {
      id: c.id,
      nombre: c.nombre,
      precio: Number(c.precio),
      descripcion: c.descripcion,
      fotoUrl: c.fotoUrl,
    };

    if (!c.categoriaCorte) {
      sinCategoria.push(corte);
      continue;
    }

    const key = c.categoriaCorte.id;
    if (!gruposMap.has(key)) {
      gruposMap.set(key, {
        nombre: c.categoriaCorte.nombre,
        orden: c.categoriaCorte.orden,
        cortes: [],
      });
    }
    gruposMap.get(key)!.cortes.push(corte);
  }

  const grupos = [...gruposMap.values()].sort((a, b) => a.orden - b.orden);
  const hayGrupos = grupos.length > 0;

  return (
    <section id="catalogo" className="bg-ink px-6 py-[120px] sm:px-[6vw]">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-14 text-center">
          <p className="text-[13px] font-bold uppercase tracking-[3px] text-brass">
            Catálogo
          </p>
          <h2 className="mt-3 font-display text-[clamp(40px,5vw,64px)] uppercase text-cream">
            Cortes para todo tipo de estilo
          </h2>
        </div>

        {!hayGrupos && (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-7">
            {sinCategoria.map((corte) => (
              <TarjetaCorte key={corte.id} corte={corte} />
            ))}
          </div>
        )}

        {hayGrupos && (
          <div className="flex flex-col gap-14">
            {grupos.map((grupo) => (
              <div key={grupo.nombre}>
                <h3 className="mb-6 font-display text-2xl uppercase text-brass">
                  {grupo.nombre}
                </h3>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-7">
                  {grupo.cortes.map((corte) => (
                    <TarjetaCorte key={corte.id} corte={corte} />
                  ))}
                </div>
              </div>
            ))}
            {sinCategoria.length > 0 && (
              <div>
                <h3 className="mb-6 font-display text-2xl uppercase text-brass">
                  Otros cortes
                </h3>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-7">
                  {sinCategoria.map((corte) => (
                    <TarjetaCorte key={corte.id} corte={corte} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
