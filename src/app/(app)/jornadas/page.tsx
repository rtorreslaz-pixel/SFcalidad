import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function JornadasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "JEFE") redirect("/dashboard-bi");
  if (user.role === "COMERCIAL") redirect("/dashboard/pesaje");

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
      {/* ---- Cabecera ---- */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-slate-900">
          {user.role === "VERIFICADOR" ? "Mis jornadas" : "Jornadas"}
        </h1>
        <div className="flex gap-2">
          <Link
            href="/jornadas/reportes"
            className="flex-1 rounded-lg border border-brand/40 px-3 py-2.5 text-center text-sm font-semibold text-brand hover:bg-brand/5 sm:flex-none"
          >
            📋 Reportes del día
          </Link>
          <Link
            href="/jornadas/nueva"
            className="flex-1 rounded-lg bg-brand px-3 py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-hover sm:flex-none sm:px-5"
          >
            + Nueva jornada
          </Link>
        </div>
      </div>

      {jornadas.length === 0 ? (
        <div className="rounded-xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
          <p className="text-slate-400">No hay jornadas registradas.</p>
          <Link href="/jornadas/nueva" className="mt-3 inline-block text-sm font-semibold text-brand hover:underline">
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
                className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 hover:ring-brand/40 active:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">
                    {j.fecha.toLocaleDateString("es-PE", { weekday: "short", day: "numeric", month: "short" })}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-slate-500">{j.cliente.nombre}</p>
                  {user.role === "SUPERVISOR" && (
                    <p className="text-xs text-slate-400">{j.verificador.nombre}</p>
                  )}
                </div>
                <div className="ml-3 flex-none text-right">
                  <p className="text-sm font-semibold text-slate-700">
                    {total === 0 ? "Sin evaluaciones" : `${completadas}/${total} completadas`}
                  </p>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    total === 0
                      ? "bg-slate-100 text-slate-500"
                      : completadas === total
                        ? "bg-sky-50 text-sky-700"
                        : "bg-amber-100 text-amber-700"
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
