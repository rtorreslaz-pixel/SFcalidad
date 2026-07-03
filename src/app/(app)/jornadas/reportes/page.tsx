import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import PrintButton from "../print-button";
import ReporteCard, { type ReporteData } from "../reporte-card";

function hoyIso() {
  return new Date().toISOString().slice(0, 10);
}

export default async function ReportesDelDiaPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "JEFE") redirect("/dashboard-bi");

  const { fecha: fechaParam } = await searchParams;
  const fechaStr = fechaParam || hoyIso();
  const fecha = new Date(`${fechaStr}T00:00:00.000Z`);
  const finDia = new Date(fecha.getTime() + 24 * 3600 * 1000);
  const rango = { gte: fecha, lt: finDia };

  // Se arma un reporte por cliente desde las inspecciones del día (con o sin jornada),
  // usando la fecha efectiva (campo `fecha` directo o el de la jornada). Así aparecen
  // también las inspecciones cargadas por importación, que no tienen jornada.
  const inspecciones = await prisma.inspeccion.findMany({
    where: {
      estado: "COMPLETA",
      ...(user.role === "VERIFICADOR" ? { verificadorId: user.id } : {}),
      OR: [
        { fecha: rango },
        { AND: [{ fecha: null }, { jornada: { is: { fecha: rango } } }] },
      ],
    },
    include: {
      plantel: { select: { codigo: true } },
      defectos: { include: { tipoDefecto: true }, orderBy: { tipoDefecto: { orden: "asc" } } },
      evaluacionesLesion: true,
      cliente: { select: { nombre: true } },
      verificador: { select: { nombre: true } },
      jornada: { select: { cliente: { select: { nombre: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Agrupar por cliente efectivo
  const grupos = new Map<string, ReporteData & { verificadores: Set<string> }>();
  for (const insp of inspecciones) {
    const nombre = insp.cliente?.nombre ?? insp.jornada?.cliente?.nombre ?? "Sin cliente";
    const existing = grupos.get(nombre);
    const g =
      existing ??
      {
        fecha,
        cliente: { nombre },
        verificador: { nombre: "" },
        inspecciones: [],
        verificadores: new Set<string>(),
      };
    if (!existing) grupos.set(nombre, g);
    g.inspecciones.push(insp);
    if (insp.verificador?.nombre) g.verificadores.add(insp.verificador.nombre);
  }
  const reportes: ReporteData[] = Array.from(grupos.values())
    .sort((a, b) => a.cliente.nombre.localeCompare(b.cliente.nombre))
    .map((g) => ({ ...g, verificador: { nombre: [...g.verificadores].join(", ") || "—" } }));

  const fechaLabel = fecha.toLocaleDateString("es-PE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href="/jornadas" className="text-sm text-emerald-700 hover:underline">
          ← Jornadas
        </Link>
        {reportes.length > 0 && <PrintButton />}
      </div>

      <div className="mb-6 print:hidden">
        <h1 className="mb-3 text-xl font-bold text-slate-900">Reportes del día</h1>
        <form className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Fecha</label>
            <input type="date" name="fecha" defaultValue={fechaStr} className="input" />
          </div>
          <button
            type="submit"
            className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
          >
            Ver
          </button>
        </form>
        <p className="mt-3 text-sm capitalize text-slate-500">
          {fechaLabel} · {reportes.length} {reportes.length === 1 ? "reporte" : "reportes"}
        </p>
      </div>

      {reportes.length === 0 ? (
        <div className="rounded-xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200 print:hidden">
          <p className="text-slate-400">No hay inspecciones registradas para esta fecha.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reportes.map((r) => (
            <div key={r.cliente.nombre} className="print:break-after-page">
              <ReporteCard jornada={r} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
