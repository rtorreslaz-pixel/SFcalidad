import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calcularPorcentajeSeleccion, META_SELECCION_DEFAULT } from "@/lib/calc";
import DashboardCharts from "./charts";
import type { Prisma } from "@/generated/prisma/client";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "VERIFICADOR") redirect("/jornadas");

  const where: Prisma.InspeccionWhereInput = {};

  const inspecciones = await prisma.inspeccion.findMany({
    where,
    include: {
      cliente: true,
      defectos: { include: { tipoDefecto: true } },
    },
    orderBy: { fecha: "asc" },
  });

  const totalInspecciones = inspecciones.length;
  const totalAves = inspecciones.reduce((acc, i) => acc + i.cantidad, 0);
  const totalSeleccion = inspecciones.reduce(
    (acc, i) => acc + i.defectos.reduce((a, d) => a + d.unidades, 0),
    0
  );
  const porcentajeGlobal = calcularPorcentajeSeleccion(totalSeleccion, totalAves);
  const meta = inspecciones[0]?.metaPorcentaje ?? META_SELECCION_DEFAULT;

  // Tendencia semanal
  const semanaMap = new Map<string, { unidades: number; cantidad: number; anio: number; semana: number }>();
  for (const insp of inspecciones) {
    if (insp.anio == null || insp.semana == null) continue;
    const key = `${insp.anio}-S${insp.semana.toString().padStart(2, "0")}`;
    const entry = semanaMap.get(key) ?? { unidades: 0, cantidad: 0, anio: insp.anio, semana: insp.semana };
    entry.unidades += insp.defectos.reduce((a, d) => a + d.unidades, 0);
    entry.cantidad += insp.cantidad;
    semanaMap.set(key, entry);
  }
  const tendenciaSemanal = Array.from(semanaMap.entries())
    .sort((a, b) => a[1].anio - b[1].anio || a[1].semana - b[1].semana)
    .map(([label, v]) => ({
      label,
      porcentaje: Number(calcularPorcentajeSeleccion(v.unidades, v.cantidad).toFixed(3)),
      meta,
    }));

  // Por cliente
  const clienteMap = new Map<string, { unidades: number; cantidad: number }>();
  for (const insp of inspecciones) {
    if (!insp.cliente) continue;
    const entry = clienteMap.get(insp.cliente.nombre) ?? { unidades: 0, cantidad: 0 };
    entry.unidades += insp.defectos.reduce((a, d) => a + d.unidades, 0);
    entry.cantidad += insp.cantidad;
    clienteMap.set(insp.cliente.nombre, entry);
  }
  const porCliente = Array.from(clienteMap.entries())
    .map(([cliente, v]) => ({
      cliente,
      porcentaje: Number(calcularPorcentajeSeleccion(v.unidades, v.cantidad).toFixed(3)),
      meta,
    }))
    .sort((a, b) => b.porcentaje - a.porcentaje);

  // Por tipo de defecto
  const defectoMap = new Map<string, number>();
  for (const insp of inspecciones) {
    for (const d of insp.defectos) {
      defectoMap.set(d.tipoDefecto.nombre, (defectoMap.get(d.tipoDefecto.nombre) ?? 0) + d.unidades);
    }
  }
  const porDefecto = Array.from(defectoMap.entries())
    .map(([defecto, unidades]) => ({ defecto, unidades }))
    .sort((a, b) => b.unidades - a.unidades)
    .slice(0, 10);

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-slate-900">Dashboard</h1>
      <p className="mb-6 text-sm text-slate-500">
        Resumen general de inspecciones de todos los verificadores.
      </p>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Inspecciones registradas" value={totalInspecciones.toString()} />
        <KpiCard label="Aves inspeccionadas" value={totalAves.toLocaleString("es-PE")} />
        <KpiCard label="Unidades seleccionadas" value={totalSeleccion.toLocaleString("es-PE")} />
        <KpiCard
          label="% Selección global"
          value={`${porcentajeGlobal.toFixed(3)}%`}
          highlight={porcentajeGlobal > meta ? "danger" : "ok"}
          sub={`Meta: ${meta}%`}
        />
      </div>

      <DashboardCharts tendenciaSemanal={tendenciaSemanal} porCliente={porCliente} porDefecto={porDefecto} />
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: "ok" | "danger";
}) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold ${
          highlight === "danger"
            ? "text-red-600"
            : highlight === "ok"
            ? "text-emerald-600"
            : "text-slate-900"
        }`}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}
