import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function JornadasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "JEFE") redirect("/dashboard");

  const jornadas = await prisma.jornada.findMany({
    where: user.role === "VERIFICADOR" ? { verificadorId: user.id } : {},
    orderBy: { fecha: "desc" },
    take: 50,
    include: {
      cliente: true,
      verificador: { select: { nombre: true } },
      _count: { select: { inspecciones: true, saldos: true } },
      inspecciones: { select: { estado: true } },
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-slate-900">Mis jornadas</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/jornadas/reportes"
            className="rounded-xl border border-emerald-300 px-4 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            📋 Reportes del día
          </Link>
          <Link
            href="/jornadas/nueva"
            className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800"
          >
            + Nueva jornada
          </Link>
        </div>
      </div>

      {jornadas.length === 0 ? (
        <div className="rounded-xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
          <p className="text-slate-400">No hay jornadas registradas.</p>
          <Link href="/jornadas/nueva" className="mt-3 inline-block text-sm font-semibold text-emerald-600 hover:underline">
            Crear primera jornada →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {jornadas.map((j) => {
            const completadas = j.inspecciones.filter((i) => i.estado === "COMPLETA").length;
            const total = j.inspecciones.length;
            return (
              <Link
                key={j.id}
                href={`/jornadas/${j.id}`}
                className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 hover:ring-emerald-300 active:bg-slate-50"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {j.fecha.toLocaleDateString("es-PE", { weekday: "short", day: "numeric", month: "short" })}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500">{j.cliente.nombre}</p>
                  {user.role === "SUPERVISOR" && (
                    <p className="text-xs text-slate-400">{j.verificador.nombre}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-700">
                    {total === 0 ? "Sin evaluaciones" : `${completadas}/${total} completadas`}
                  </p>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    total === 0 ? "bg-slate-100 text-slate-500" :
                    completadas === total ? "bg-emerald-100 text-emerald-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>
                    {total === 0 ? "Inicio" : completadas === total ? "Completa" : "En progreso"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
