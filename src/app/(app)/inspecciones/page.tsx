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

  const params = await searchParams;

  const where: Prisma.InspeccionWhereInput = {};

  if (user.role === "VERIFICADOR") {
    where.verificadorId = user.id;
  } else if (params.verificadorId) {
    where.verificadorId = params.verificadorId;
  }

  if (params.clienteId) where.clienteId = params.clienteId;

  if (params.desde || params.hasta) {
    where.fecha = {};
    if (params.desde) where.fecha.gte = new Date(params.desde);
    if (params.hasta) where.fecha.lte = new Date(params.hasta + "T23:59:59");
  }

  const [inspecciones, clientes, verificadores] = await Promise.all([
    prisma.inspeccion.findMany({
      where,
      orderBy: { fecha: "desc" },
      take: 100,
      include: {
        cliente: true,
        plantel: true,
        verificador: { select: { nombre: true } },
        defectos: true,
        _count: { select: { fotos: true } },
      },
    }),
    prisma.cliente.findMany({ orderBy: { nombre: "asc" } }),
    user.role === "SUPERVISOR"
      ? prisma.user.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } })
      : Promise.resolve([]),
  ]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Inspecciones</h1>
        <div className="flex gap-2">
          <a
            href={`/api/export?${new URLSearchParams(
              Object.entries(params).filter(([, v]) => !!v) as [string, string][]
            ).toString()}`}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Exportar CSV
          </a>
          <Link
            href="/inspecciones/nueva"
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            + Nueva inspección
          </Link>
        </div>
      </div>

      <form className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:grid-cols-4">
        <select name="clienteId" defaultValue={params.clienteId ?? ""} className="input">
          <option value="">Todos los clientes</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        {user.role === "SUPERVISOR" && (
          <select name="verificadorId" defaultValue={params.verificadorId ?? ""} className="input">
            <option value="">Todos los verificadores</option>
            {verificadores.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nombre}
              </option>
            ))}
          </select>
        )}
        <input type="date" name="desde" defaultValue={params.desde ?? ""} className="input" />
        <input type="date" name="hasta" defaultValue={params.hasta ?? ""} className="input" />
        <button
          type="submit"
          className="col-span-2 rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 sm:col-span-1"
        >
          Filtrar
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">Fecha</th>
              <th className="px-3 py-2 font-medium">Cliente</th>
              <th className="px-3 py-2 font-medium">Plantel / Galpón</th>
              <th className="px-3 py-2 font-medium">Cantidad</th>
              <th className="px-3 py-2 font-medium">% Selección</th>
              <th className="px-3 py-2 font-medium">Verificador</th>
              <th className="px-3 py-2 font-medium">Fotos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {inspecciones.map((insp) => {
              const totalUnidades = insp.defectos.reduce((acc, d) => acc + d.unidades, 0);
              const porcentaje = calcularPorcentajeSeleccion(totalUnidades, insp.cantidad);
              const excede = porcentaje > insp.metaPorcentaje;
              return (
                <tr key={insp.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2">
                    <Link href={`/inspecciones/${insp.id}`} className="text-emerald-700 hover:underline">
                      {insp.fecha.toLocaleDateString("es-PE")}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{insp.cliente.nombre}</td>
                  <td className="px-3 py-2">
                    {insp.plantel?.codigo ?? "-"} {insp.galpon ? `· ${insp.galpon}` : ""}
                  </td>
                  <td className="px-3 py-2">{insp.cantidad}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-md px-2 py-0.5 font-semibold ${
                        excede ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {porcentaje.toFixed(3)}%
                    </span>
                  </td>
                  <td className="px-3 py-2">{insp.verificador.nombre}</td>
                  <td className="px-3 py-2">{insp._count.fotos}</td>
                </tr>
              );
            })}
            {inspecciones.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-slate-400">
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
