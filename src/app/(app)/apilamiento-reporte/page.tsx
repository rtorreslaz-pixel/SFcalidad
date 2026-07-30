import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { enlacePublico } from "@/lib/apilamiento-token";
import type { Prisma } from "@/generated/prisma/client";

// Reporte de las verificaciones de apilamiento y ventilación (IICYB003) que los verificadores
// registran desde el enlace público. Solo lectura + export CSV.

const SEMAFORO_BADGE: Record<string, string> = {
  VERDE: "bg-green-100 text-green-700",
  AMBAR: "bg-amber-100 text-amber-700",
  ROJO: "bg-red-100 text-red-700",
  NA: "bg-slate-100 text-slate-500",
};

const SEMAFORO_TEXTO: Record<string, string> = {
  VERDE: "🟢 Verde",
  AMBAR: "🟡 Ámbar",
  ROJO: "🔴 Rojo",
  NA: "— s/d",
};

export default async function ApilamientoReportePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const params = await searchParams;
  const val = (k: string) => {
    const v = params[k];
    return (Array.isArray(v) ? v[0] : v) ?? "";
  };

  const clienteId = val("cliente");
  const semaforo = val("semaforo");
  const desde = val("desde");
  const hasta = val("hasta");

  const where: Prisma.ApilamientoRegistroWhereInput = {};
  if (clienteId) where.clienteId = clienteId;
  if (semaforo) where.semaforo = semaforo as Prisma.ApilamientoRegistroWhereInput["semaforo"];
  if (desde || hasta) {
    where.fechaEvaluacion = {};
    if (desde) where.fechaEvaluacion.gte = new Date(desde);
    if (hasta) where.fechaEvaluacion.lte = new Date(hasta + "T23:59:59");
  }

  const [registros, clientes] = await Promise.all([
    prisma.apilamientoRegistro.findMany({
      where,
      orderBy: { fechaEvaluacion: "desc" },
      take: 300,
      include: {
        cliente: { select: { nombre: true } },
        _count: { select: { medias: true } },
      },
    }),
    prisma.cliente.findMany({ orderBy: { nombre: "asc" }, select: { id: true, nombre: true } }),
  ]);

  const conPorcentaje = registros.filter((r) => r.porcentajeCumplimiento != null);
  const promedio =
    conPorcentaje.length > 0
      ? conPorcentaje.reduce((a, r) => a + (r.porcentajeCumplimiento ?? 0), 0) / conPorcentaje.length
      : null;
  const criticos = registros.filter((r) => r.hallazgoCritico).length;
  const totalNC = registros.reduce((a, r) => a + r.itemsNoConformes, 0);

  // % de cumplimiento por ítem (identifica el ítem más incumplido a nivel sistémico).
  const porItem = await prisma.apilamientoDetalle.groupBy({
    by: ["itemCodigo", "resultado"],
    _count: { _all: true },
  });
  const itemStats = new Map<string, { c: number; nc: number }>();
  for (const fila of porItem) {
    const e = itemStats.get(fila.itemCodigo) ?? { c: 0, nc: 0 };
    if (fila.resultado === "C") e.c += fila._count._all;
    if (fila.resultado === "NC") e.nc += fila._count._all;
    itemStats.set(fila.itemCodigo, e);
  }
  const ranking = [...itemStats.entries()]
    .map(([codigo, s]) => ({ codigo, total: s.c + s.nc, pct: s.c + s.nc > 0 ? (s.c / (s.c + s.nc)) * 100 : null }))
    .filter((r) => r.total > 0)
    .sort((a, b) => (a.pct ?? 100) - (b.pct ?? 100));

  // El enlace se arma con el host de la petición, así sale completo y copiable tal cual.
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const link = host ? enlacePublico(`${proto}://${host}`) : null;

  const qs = new URLSearchParams();
  if (clienteId) qs.set("cliente", clienteId);
  if (semaforo) qs.set("semaforo", semaforo);
  if (desde) qs.set("desde", desde);
  if (hasta) qs.set("hasta", hasta);

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Apilamiento y ventilación de jabas</h1>
        <a
          href={`/api/apilamiento/export?${qs.toString()}`}
          download
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Descargar CSV
        </a>
      </div>
      <p className="mb-4 text-sm text-slate-500">
        Verificaciones registradas por los verificadores en los locales de clientes (instructivo IICYB003).
      </p>

      {link && (
        <div className="mb-4 rounded-xl bg-blue-50 p-3 text-xs text-blue-900 ring-1 ring-blue-200">
          <b>Enlace para los verificadores:</b> <span className="break-all">{link}</span>
        </div>
      )}

      {/* Totalizadores */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tarjeta titulo="Verificaciones" valor={String(registros.length)} />
        <Tarjeta titulo="Cumplimiento prom." valor={promedio != null ? `${promedio.toFixed(1)}%` : "—"} />
        <Tarjeta titulo="Ítems no conformes" valor={String(totalNC)} />
        <Tarjeta titulo="Hallazgos críticos" valor={String(criticos)} destacar={criticos > 0} />
      </div>

      {/* Filtros */}
      <form className="mb-4 flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Cliente</label>
          <select name="cliente" defaultValue={clienteId} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Todos</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Semáforo</label>
          <select name="semaforo" defaultValue={semaforo} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Todos</option>
            <option value="VERDE">Verde</option>
            <option value="AMBAR">Ámbar</option>
            <option value="ROJO">Rojo</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Desde</label>
          <input type="date" name="desde" defaultValue={desde} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Hasta</label>
          <input type="date" name="hasta" defaultValue={hasta} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <button className="rounded-lg bg-[#0B4EA2] px-4 py-2 text-sm font-semibold text-white">Filtrar</button>
      </form>

      {registros.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
          Todavía no hay verificaciones registradas.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-2.5 font-medium">Código</th>
                <th className="px-3 py-2.5 font-medium">Fecha</th>
                <th className="px-3 py-2.5 font-medium">Cliente</th>
                <th className="px-3 py-2.5 font-medium">Local</th>
                <th className="px-3 py-2.5 font-medium">Verificador</th>
                <th className="px-3 py-2.5 font-medium">Ventilación</th>
                <th className="px-3 py-2.5 font-medium">C / NC</th>
                <th className="px-3 py-2.5 font-medium">%</th>
                <th className="px-3 py-2.5 font-medium">Semáforo</th>
                <th className="px-3 py-2.5 font-medium">Evidencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {registros.map((r) => (
                <tr key={r.id} className={`hover:bg-slate-50 ${r.hallazgoCritico ? "bg-red-50/40" : ""}`}>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <Link href={`/apilamiento-reporte/${r.id}`} className="font-semibold text-blue-700 hover:underline">
                      {r.codigoRegistro}
                    </Link>
                    {r.hallazgoCritico && <span className="ml-1 text-xs font-bold text-red-700">crítico</span>}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.fechaEvaluacion.toLocaleDateString("es-PE")}</td>
                  <td className="px-3 py-2">{r.cliente.nombre}</td>
                  <td className="px-3 py-2 font-semibold">{r.local}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-slate-600">{r.verificadorNombre}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-slate-600">
                    {r.tipoVentilacion === "MECANICA" ? `Mecánica (${r.cantidadVentiladores ?? 0})` : "Natural"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="font-semibold text-green-700">{r.itemsConformes}</span>
                    {" / "}
                    <span className="font-semibold text-red-700">{r.itemsNoConformes}</span>
                    {(r.itemsNa > 0 || r.itemsVn > 0) && (
                      <span className="text-xs text-slate-400"> (+{r.itemsNa + r.itemsVn} n/a)</span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-semibold whitespace-nowrap">
                    {r.porcentajeCumplimiento != null ? `${r.porcentajeCumplimiento.toFixed(1)}%` : "—"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`rounded px-2 py-0.5 text-xs font-bold ${SEMAFORO_BADGE[r.semaforo]}`}>
                      {SEMAFORO_TEXTO[r.semaforo]}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-slate-500">{r._count.medias}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cumplimiento por ítem */}
      {ranking.length > 0 && (
        <>
          <h2 className="mb-2 mt-8 text-sm font-bold text-slate-900">Cumplimiento por ítem (histórico)</h2>
          <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-3 py-2.5 font-medium">Ítem</th>
                  <th className="px-3 py-2.5 font-medium">Evaluado</th>
                  <th className="px-3 py-2.5 font-medium">% cumplimiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ranking.map((r) => (
                  <tr key={r.codigo}>
                    <td className="px-3 py-2 font-semibold">{r.codigo}</td>
                    <td className="px-3 py-2 text-slate-500">{r.total} veces</td>
                    <td className="px-3 py-2 font-semibold">
                      <span className={(r.pct ?? 100) < 85 ? "text-red-700" : (r.pct ?? 100) < 95 ? "text-amber-700" : "text-green-700"}>
                        {r.pct != null ? `${r.pct.toFixed(1)}%` : "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Tarjeta({ titulo, valor, destacar }: { titulo: string; valor: string; destacar?: boolean }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{titulo}</div>
      <div className={`mt-1 text-2xl font-bold ${destacar ? "text-red-700" : "text-slate-900"}`}>{valor}</div>
    </div>
  );
}
