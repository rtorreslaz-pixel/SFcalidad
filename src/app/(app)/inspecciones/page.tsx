import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calcularPorcentajeSeleccion } from "@/lib/calc";
import type { Prisma } from "@/generated/prisma/client";

export default async function InspeccionesPage({
  searchParams,
}: {
  searchParams: Promise<{ clienteId?: string; verificadorId?: string; desde?: string; hasta?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "VERIFICADOR") redirect("/jornadas");
  if (user.role === "JEFE") redirect("/dashboard");
  if (user.role === "COMERCIAL") redirect("/dashboard/preventa");

  const params = await searchParams;

  const andConds: Prisma.InspeccionWhereInput[] = [];

  if (params.verificadorId) {
    andConds.push({
      OR: [{ verificadorId: params.verificadorId }, { jornada: { verificadorId: params.verificadorId } }],
    });
  }

  if (params.clienteId) {
    andConds.push({ OR: [{ clienteId: params.clienteId }, { jornada: { clienteId: params.clienteId } }] });
  }

  const where: Prisma.InspeccionWhereInput = andConds.length ? { AND: andConds } : {};

  const [inspeccionesRaw, clientes, verificadores] = await Promise.all([
    prisma.inspeccion.findMany({
      where,
      include: {
        cliente: true,
        plantel: true,
        verificador: { select: { nombre: true } },
        defectos: true,
        _count: { select: { fotos: true } },
        jornada: { select: { fecha: true, cliente: { select: { nombre: true } }, verificador: { select: { nombre: true } } } },
      },
    }),
    prisma.cliente.findMany({ orderBy: { nombre: "asc" } }),
    user.role === "SUPERVISOR"
      ? prisma.user.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } })
      : Promise.resolve([]),
  ]);

  const desdeDate = params.desde ? new Date(params.desde) : null;
  const hastaDate = params.hasta ? new Date(`${params.hasta}T23:59:59`) : null;

  const enriquecidas = inspeccionesRaw
    .map((insp) => ({
      insp,
      fecha: insp.fecha ?? insp.jornada?.fecha ?? null,
      clienteNombre: insp.cliente?.nombre ?? insp.jornada?.cliente?.nombre ?? null,
      verificadorNombre: insp.verificador?.nombre ?? insp.jornada?.verificador?.nombre ?? null,
    }))
    .filter(({ fecha }) => {
      if (desdeDate && (!fecha || fecha < desdeDate)) return false;
      if (hastaDate && (!fecha || fecha > hastaDate)) return false;
      return true;
    });

  enriquecidas.sort((a, b) => (b.fecha?.getTime() ?? 0) - (a.fecha?.getTime() ?? 0));

  const inspecciones = enriquecidas.slice(0, 100);

  const filterQs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => !!v) as [string, string][]
  ).toString();

  return (
    <div>
      {/* ---- Cabecera ---- */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-slate-900">Inspecciones</h1>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/api/export?${filterQs}`}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Exportar CSV
          </a>
          <details className="relative">
            <summary className="cursor-pointer list-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Descargas BI ▾
            </summary>
            <div className="absolute right-0 z-10 mt-1 w-52 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
              {(
                [
                  ["Pododermatitis / Rasguños", "pododermatitis"],
                  ["Hematomas", "hematomas"],
                  ["Pigmentación", "pigmentacion"],
                  ["Temperaturas", "temperaturas"],
                  ["Selección / Merma", "seleccion"],
                ] as const
              ).map(([label, endpoint]) => (
                <a
                  key={endpoint}
                  href={`/api/export/${endpoint}?${filterQs}`}
                  className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  {label}
                </a>
              ))}
            </div>
          </details>
          <Link
            href="/inspecciones/nueva"
            className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-hover"
          >
            + Nueva
          </Link>
        </div>
      </div>

      {/* ---- Filtros ---- */}
      <form className="mb-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Cliente</label>
            <select name="clienteId" defaultValue={params.clienteId ?? ""} className="input">
              <option value="">Todos los clientes</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          {user.role === "SUPERVISOR" && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Verificador</label>
              <select name="verificadorId" defaultValue={params.verificadorId ?? ""} className="input">
                <option value="">Todos los verificadores</option>
                {verificadores.map((v) => (
                  <option key={v.id} value={v.id}>{v.nombre}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Desde</label>
            <input type="date" name="desde" defaultValue={params.desde ?? ""} className="input w-full" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Hasta</label>
            <input type="date" name="hasta" defaultValue={params.hasta ?? ""} className="input w-full" />
          </div>
        </div>

        <button
          type="submit"
          className="mt-3 w-full rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-900"
        >
          Filtrar
        </button>
      </form>

      {/* ---- Lista mobile ---- */}
      <div className="space-y-2 sm:hidden">
        {inspecciones.length === 0 && (
          <div className="rounded-xl bg-white px-4 py-8 text-center text-sm text-slate-400 shadow-sm ring-1 ring-slate-200">
            No hay inspecciones registradas con estos filtros.
          </div>
        )}
        {inspecciones.map(({ insp, fecha, clienteNombre, verificadorNombre }) => {
          const totalUnidades = insp.defectos.reduce((acc, d) => acc + d.unidades, 0);
          const porcentaje = calcularPorcentajeSeleccion(totalUnidades, insp.cantidad);
          const excede = porcentaje > insp.metaPorcentaje;
          return (
            <Link
              key={insp.id}
              href={`/inspecciones/${insp.id}`}
              className="block rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 hover:ring-brand/40 active:bg-slate-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-brand">
                    {fecha ? fecha.toLocaleDateString("es-PE") : "—"}
                  </p>
                  <p className="truncate text-sm font-medium text-slate-800">{clienteNombre ?? "—"}</p>
                  <p className="text-sm text-slate-500">
                    {insp.plantel?.codigo ?? "—"}
                    {insp.galpon ? ` · G${insp.galpon}` : ""}
                    {insp.corral ? ` · C${insp.corral}` : ""}
                    {insp.campania ? ` · ${insp.campania}` : ""}
                  </p>
                  {insp.complex && (
                    <p className="mt-0.5 font-mono text-xs text-slate-400">{insp.complex}</p>
                  )}
                </div>
                <div className="flex-none text-right">
                  <span className={`inline-block rounded-md px-2 py-0.5 text-sm font-semibold ${
                    excede ? "bg-red-100 text-red-700" : "bg-sky-50 text-sky-700"
                  }`}>
                    {porcentaje.toFixed(2)}%
                  </span>
                  <p className="mt-1 text-xs text-slate-400">{insp.cantidad.toLocaleString()} aves</p>
                  {insp._count.fotos > 0 && (
                    <p className="text-xs text-slate-400">📷 {insp._count.fotos}</p>
                  )}
                </div>
              </div>
              {verificadorNombre && (
                <p className="mt-1.5 text-xs text-slate-400">{verificadorNombre}</p>
              )}
            </Link>
          );
        })}
      </div>

      {/* ---- Tabla desktop ---- */}
      <div className="hidden overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200 sm:block">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-3 py-2.5 font-medium">Fecha</th>
              <th className="px-3 py-2.5 font-medium">Cliente</th>
              <th className="px-3 py-2.5 font-medium">Plantel</th>
              <th className="px-3 py-2.5 font-medium">Galpón</th>
              <th className="px-3 py-2.5 font-medium">Corral</th>
              <th className="px-3 py-2.5 font-medium">Campaña</th>
              <th className="px-3 py-2.5 font-medium">Complex</th>
              <th className="px-3 py-2.5 font-medium">Cantidad</th>
              <th className="px-3 py-2.5 font-medium">% Selección</th>
              <th className="px-3 py-2.5 font-medium">Verificador</th>
              <th className="px-3 py-2.5 font-medium">Fotos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {inspecciones.map(({ insp, fecha, clienteNombre, verificadorNombre }) => {
              const totalUnidades = insp.defectos.reduce((acc, d) => acc + d.unidades, 0);
              const porcentaje = calcularPorcentajeSeleccion(totalUnidades, insp.cantidad);
              const excede = porcentaje > insp.metaPorcentaje;
              return (
                <tr key={insp.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2">
                    <Link href={`/inspecciones/${insp.id}`} className="font-medium text-brand hover:underline">
                      {fecha ? fecha.toLocaleDateString("es-PE") : "—"}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{clienteNombre ?? "—"}</td>
                  <td className="px-3 py-2">{insp.plantel?.codigo ?? "—"}</td>
                  <td className="px-3 py-2">{insp.galpon ?? "—"}</td>
                  <td className="px-3 py-2">{insp.corral ?? "—"}</td>
                  <td className="px-3 py-2">{insp.campania ?? "—"}</td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-500">{insp.complex ?? "—"}</td>
                  <td className="px-3 py-2">{insp.cantidad.toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-md px-2 py-0.5 font-semibold ${
                      excede ? "bg-red-100 text-red-700" : "bg-sky-50 text-sky-700"
                    }`}>
                      {porcentaje.toFixed(3)}%
                    </span>
                  </td>
                  <td className="px-3 py-2">{verificadorNombre ?? "—"}</td>
                  <td className="px-3 py-2">{insp._count.fotos}</td>
                </tr>
              );
            })}
            {inspecciones.length === 0 && (
              <tr>
                <td colSpan={11} className="px-3 py-8 text-center text-slate-400">
                  No hay inspecciones registradas con estos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
