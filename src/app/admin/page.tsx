import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || session.user.rol !== "ADMIN") redirect("/cuenta");

  const [
    pagosPendientes,
    citasPendientes,
    barberosActivos,
    cortesActivos,
    diasAbiertos,
    citasCompletadas,
    penalidadesPendientes,
    adminsActivos,
    clientesActivos,
  ] = await Promise.all([
    prisma.pago.count({ where: { estado: "PENDIENTE_VALIDACION" } }),
    prisma.cita.count({ where: { estado: "REQUIERE_ADMIN" } }),
    prisma.barbero.count({ where: { activo: true } }),
    prisma.corte.count({ where: { activo: true } }),
    prisma.horarioAtencion.count(),
    prisma.cita.count({ where: { estado: "COMPLETADA" } }),
    prisma.penalidad.count({ where: { estado: "PENDIENTE", saldoPendiente: { gt: 0 } } }),
    prisma.user.count({ where: { rol: "ADMIN" } }),
    prisma.user.count({ where: { rol: "CLIENTE", activo: true } }),
  ]);

  const tarjetas = [
    {
      href: "/admin/pagos",
      titulo: "Comprobantes de pago",
      valor: pagosPendientes,
      etiqueta: "pendientes de validar",
    },
    {
      href: "/admin/citas",
      titulo: "Citas sin asignar",
      valor: citasPendientes,
      etiqueta: "requieren atención",
    },
    {
      href: "/admin/barberos",
      titulo: "Barberos",
      valor: barberosActivos,
      etiqueta: "activos",
    },
    {
      href: "/admin/catalogo",
      titulo: "Catálogo",
      valor: cortesActivos,
      etiqueta: "cortes activos",
    },
    {
      href: "/admin/horario",
      titulo: "Horario",
      valor: diasAbiertos,
      etiqueta: "días abiertos",
    },
    {
      href: "/admin/reportes",
      titulo: "Reportes",
      valor: citasCompletadas,
      etiqueta: "citas completadas",
    },
    {
      href: "/admin/penalidades",
      titulo: "Penalidades",
      valor: penalidadesPendientes,
      etiqueta: "pendientes de cobro",
    },
    {
      href: "/admin/administradores",
      titulo: "Administradores",
      valor: adminsActivos,
      etiqueta: "cuentas admin",
    },
    {
      href: "/admin/clientes",
      titulo: "Clientes",
      valor: clientesActivos,
      etiqueta: "activos",
    },
  ];

  return (
    <div className="min-h-screen bg-ink px-6 py-16 sm:px-[6vw]">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-4xl uppercase text-cream">Panel de administración</h1>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tarjetas.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="rounded border border-ink-border-2 p-5 transition-colors hover:border-brass"
            >
              <p className="text-xs uppercase tracking-wide text-cream/50">{t.titulo}</p>
              <p className="mt-2 font-display text-4xl text-brass">{t.valor}</p>
              <p className="mt-1 text-sm text-cream/60">{t.etiqueta}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
