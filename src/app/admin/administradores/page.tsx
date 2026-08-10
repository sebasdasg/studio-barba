import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NuevoAdminForm } from "./nuevo-admin-form";

export default async function AdminAdministradoresPage() {
  const session = await auth();
  if (!session?.user || session.user.rol !== "ADMIN") redirect("/cuenta");

  const admins = await prisma.user.findMany({
    where: { rol: "ADMIN" },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="min-h-screen bg-ink px-6 py-16 sm:px-[6vw]">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-4xl uppercase text-cream">Administradores</h1>
          <Link href="/admin" className="text-sm text-cream/60 hover:text-brass">
            Volver al panel
          </Link>
        </div>

        <div className="mt-8">
          <NuevoAdminForm />
        </div>

        <p className="mt-10 text-xs uppercase tracking-wide text-cream/50">
          Administradores existentes
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {admins.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded border border-ink-border-2 px-4 py-2.5 text-sm text-cream"
            >
              <span>{a.nombre}</span>
              <span className="text-cream/50">{a.celular}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
