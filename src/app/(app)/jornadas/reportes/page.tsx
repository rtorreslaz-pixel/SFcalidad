import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import PrintButton from "../print-button";
import ReporteCard, { JORNADA_REPORTE_INCLUDE } from "../reporte-card";

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

  const jornadas = await prisma.jornada.findMany({
    where: {
      fecha,
      ...(user.role === "VERIFICADOR" ? { verificadorId: user.id } : {}),
    },
    orderBy: { cliente: { nombre: "asc" } },
    include: JORNADA_REPORTE_INCLUDE,
  });

  const fechaLabel = fecha.toLocaleDateString("es-PE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href="/jornadas" className="text-sm text-emerald-700 hover:underline">
          ← Jornadas
        </Link>
        {jornadas.length > 0 && <PrintButton />}
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
          {fechaLabel} · {jornadas.length} {jornadas.length === 1 ? "reporte" : "reportes"}
        </p>
      </div>

      {jornadas.length === 0 ? (
        <div className="rounded-xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200 print:hidden">
          <p className="text-slate-400">No hay jornadas registradas para esta fecha.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {jornadas.map((j) => (
            <div key={j.id} className="print:break-after-page">
              <ReporteCard jornada={j} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
