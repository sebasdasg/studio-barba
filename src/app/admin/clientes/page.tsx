import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { EditarClienteForm } from "./editar-cliente-form";

export default async function AdminClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ clienteId?: string; q?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.rol !== "ADMIN") redirect("/cuenta");

  const params = await searchParams;
  const q = (params.q ?? "").trim();

  const clientes = await prisma.user.findMany({
    where: {
      rol: "CLIENTE",
      ...(q
        ? {
            OR: [
              { nombre: { contains: q, mode: "insensitive" } },
              { celular: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { nombre: "asc" },
  });

  const clienteSeleccionado =
    (params.clienteId ? clientes.find((c) => c.id === params.clienteId) : undefined) ??
    clientes[0];

  return (
    <div className="min-h-screen bg-ink px-6 py-16 sm:px-[6vw]">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-4xl uppercase text-cream">Clientes</h1>
          <Link href="/admin" className="text-sm text-cream/60 hover:text-brass">
            Volver al panel
          </Link>
        </div>

        <form method="get" className="mt-6 flex gap-3">
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre o celular"
            className="w-full rounded border border-ink-border-2 bg-transparent px-3 py-2 text-sm text-cream outline-none focus:border-brass"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-brass px-5 py-2 text-xs font-bold uppercase tracking-wide text-ink transition-colors hover:bg-brass-hover"
          >
            Buscar
          </button>
        </form>

        <p className="mt-8 text-xs uppercase tracking-wide text-cream/50">
          {clientes.length} {clientes.length === 1 ? "cliente" : "clientes"}
        </p>
        <div className="mt-3 flex flex-col gap-1.5">
          {clientes.map((c) => {
            const seleccionado = c.id === clienteSeleccionado?.id;
            return (
              <Link
                key={c.id}
                href={`/admin/clientes?clienteId=${c.id}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                className={cn(
                  "flex items-center justify-between rounded border px-4 py-2.5 text-sm transition-colors",
                  seleccionado
                    ? "border-brass text-brass"
                    : "border-ink-border-2 text-cream hover:border-brass/50"
                )}
              >
                <span>
                  {c.nombre}{" "}
                  <span className={cn("text-xs", seleccionado ? "text-brass/70" : "text-cream/50")}>
                    {c.activo ? "· activo" : "· inactivo"}
                  </span>
                </span>
                <span className="text-xs">{c.celular ?? "—"}</span>
              </Link>
            );
          })}
        </div>

        {clienteSeleccionado && (
          <div className="mt-6">
            <EditarClienteForm
              key={clienteSeleccionado.id}
              clienteId={clienteSeleccionado.id}
              nombreInicial={clienteSeleccionado.nombre}
              celularInicial={clienteSeleccionado.celular}
              emailInicial={clienteSeleccionado.email}
              activoInicial={clienteSeleccionado.activo}
            />
          </div>
        )}
      </div>
    </div>
  );
}
