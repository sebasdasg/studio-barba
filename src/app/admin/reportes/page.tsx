import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { hoyISOEnNegocio, fechaISOaDate } from "@/lib/reservas/horario";

function primerDiaDelMes(hoyISO: string): string {
  return `${hoyISO.slice(0, 7)}-01`;
}

export default async function AdminReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string; barberoId?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.rol !== "ADMIN") redirect("/cuenta");

  const params = await searchParams;
  const hoyISO = hoyISOEnNegocio();
  const desdeISO = params.desde || primerDiaDelMes(hoyISO);
  const hastaISO = params.hasta || hoyISO;
  const barberoIdFiltro = params.barberoId || "";

  const [citas, todosLosBarberos] = await Promise.all([
    prisma.cita.findMany({
      where: {
        estado: "COMPLETADA",
        fecha: { gte: fechaISOaDate(desdeISO), lte: fechaISOaDate(hastaISO) },
        ...(barberoIdFiltro ? { barberoId: barberoIdFiltro } : {}),
      },
      include: {
        corte: true,
        barbero: { include: { user: true } },
        adicionales: true,
      },
    }),
    prisma.barbero.findMany({ include: { user: true }, orderBy: { user: { nombre: "asc" } } }),
  ]);

  let ingresoTotal = 0;
  const porBarbero = new Map<
    string,
    { nombre: string; comisionPorcentaje: number; citas: number; ingreso: number }
  >();
  const porCorte = new Map<string, { nombre: string; citas: number; ingreso: number }>();
  const porCanal = {
    online: { citas: 0, ingreso: 0 },
    presencial: { citas: 0, ingreso: 0 },
  };

  for (const cita of citas) {
    const ingresoCita =
      Number(cita.precioCorte) + cita.adicionales.reduce((s, a) => s + Number(a.precio), 0);
    ingresoTotal += ingresoCita;

    if (cita.barbero) {
      const actual = porBarbero.get(cita.barbero.id) ?? {
        nombre: cita.barbero.user.nombre,
        comisionPorcentaje: Number(cita.barbero.comisionPorcentaje),
        citas: 0,
        ingreso: 0,
      };
      actual.citas += 1;
      actual.ingreso += ingresoCita;
      porBarbero.set(cita.barbero.id, actual);
    }

    const actualCorte = porCorte.get(cita.corte.id) ?? {
      nombre: cita.corte.nombre,
      citas: 0,
      ingreso: 0,
    };
    actualCorte.citas += 1;
    actualCorte.ingreso += ingresoCita;
    porCorte.set(cita.corte.id, actualCorte);

    const canal = cita.esPresencial ? porCanal.presencial : porCanal.online;
    canal.citas += 1;
    canal.ingreso += ingresoCita;
  }

  const barberos = Array.from(porBarbero.values()).sort((a, b) => b.ingreso - a.ingreso);
  const cortes = Array.from(porCorte.values()).sort((a, b) => b.ingreso - a.ingreso);

  return (
    <div className="min-h-screen bg-ink px-6 py-16 sm:px-[6vw]">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-4xl uppercase text-cream">Reportes de ingresos</h1>
          <Link href="/admin" className="text-sm text-cream/60 hover:text-brass">
            Volver al panel
          </Link>
        </div>

        <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs uppercase tracking-wide text-cream/50" htmlFor="desde">
              Desde
            </label>
            <input
              id="desde"
              name="desde"
              type="date"
              defaultValue={desdeISO}
              max={hoyISO}
              className="mt-1 block rounded border border-ink-border-2 bg-ink px-3 py-2 text-sm text-cream outline-none focus:border-brass"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-cream/50" htmlFor="hasta">
              Hasta
            </label>
            <input
              id="hasta"
              name="hasta"
              type="date"
              defaultValue={hastaISO}
              max={hoyISO}
              className="mt-1 block rounded border border-ink-border-2 bg-ink px-3 py-2 text-sm text-cream outline-none focus:border-brass"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-cream/50" htmlFor="barberoId">
              Barbero
            </label>
            <select
              id="barberoId"
              name="barberoId"
              defaultValue={barberoIdFiltro}
              className="mt-1 block rounded border border-ink-border-2 bg-ink px-3 py-2 text-sm text-cream outline-none focus:border-brass"
            >
              <option value="">Todos</option>
              {todosLosBarberos.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.user.nombre}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded-full bg-brass px-6 py-2.5 text-xs font-bold uppercase tracking-wide text-ink transition-colors hover:bg-brass-hover"
          >
            Filtrar
          </button>
        </form>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="rounded border border-ink-border-2 p-5">
            <p className="text-xs uppercase tracking-wide text-cream/50">Ingreso total</p>
            <p className="mt-2 font-display text-4xl text-brass">S/ {ingresoTotal.toFixed(2)}</p>
          </div>
          <div className="rounded border border-ink-border-2 p-5">
            <p className="text-xs uppercase tracking-wide text-cream/50">Citas completadas</p>
            <p className="mt-2 font-display text-4xl text-brass">{citas.length}</p>
          </div>
        </div>

        <p className="mt-10 text-xs uppercase tracking-wide text-cream/50">Por barbero</p>
        {barberos.length === 0 ? (
          <p className="mt-3 text-sm text-cream/60">Sin citas completadas en este rango.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-cream/50">
                  <th className="pb-2">Barbero</th>
                  <th className="pb-2">Citas</th>
                  <th className="pb-2">Ingreso generado</th>
                  <th className="pb-2">Comisión</th>
                  <th className="pb-2">Neto local</th>
                </tr>
              </thead>
              <tbody>
                {barberos.map((b) => {
                  const comision = (b.ingreso * b.comisionPorcentaje) / 100;
                  return (
                    <tr key={b.nombre} className="border-t border-ink-border-2 text-cream">
                      <td className="py-2">{b.nombre}</td>
                      <td className="py-2">{b.citas}</td>
                      <td className="py-2">S/ {b.ingreso.toFixed(2)}</td>
                      <td className="py-2">
                        S/ {comision.toFixed(2)}{" "}
                        <span className="text-cream/50">({b.comisionPorcentaje}%)</span>
                      </td>
                      <td className="py-2">S/ {(b.ingreso - comision).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-10 text-xs uppercase tracking-wide text-cream/50">Por corte</p>
        {cortes.length === 0 ? (
          <p className="mt-3 text-sm text-cream/60">Sin citas completadas en este rango.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-cream/50">
                  <th className="pb-2">Corte</th>
                  <th className="pb-2">Vendido</th>
                  <th className="pb-2">Ingreso</th>
                </tr>
              </thead>
              <tbody>
                {cortes.map((c) => (
                  <tr key={c.nombre} className="border-t border-ink-border-2 text-cream">
                    <td className="py-2">{c.nombre}</td>
                    <td className="py-2">{c.citas}</td>
                    <td className="py-2">S/ {c.ingreso.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-10 text-xs uppercase tracking-wide text-cream/50">Por canal</p>
        {citas.length === 0 ? (
          <p className="mt-3 text-sm text-cream/60">Sin citas completadas en este rango.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-cream/50">
                  <th className="pb-2">Canal</th>
                  <th className="pb-2">Citas</th>
                  <th className="pb-2">Ingreso</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-ink-border-2 text-cream">
                  <td className="py-2">Reserva online</td>
                  <td className="py-2">{porCanal.online.citas}</td>
                  <td className="py-2">S/ {porCanal.online.ingreso.toFixed(2)}</td>
                </tr>
                <tr className="border-t border-ink-border-2 text-cream">
                  <td className="py-2">Presencial</td>
                  <td className="py-2">{porCanal.presencial.citas}</td>
                  <td className="py-2">S/ {porCanal.presencial.ingreso.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
