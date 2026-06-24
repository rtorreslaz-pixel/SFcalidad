import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import PreventaCharts from "./charts";
import AutoRefresh from "./auto-refresh";
import LiveWeights from "./live-weights";
import type { Prisma } from "@/generated/prisma/client";
import type { CategoriaAve } from "@/generated/prisma/enums";

export default async function PreventaDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const where: Prisma.RegistroPesoPreventaWhereInput =
    user.role === "VERIFICADOR" ? { verificadorId: user.id } : {};

  const registros = await prisma.registroPesoPreventa.findMany({
    where,
    include: {
      plantel: { select: { codigo: true } },
      verificador: { select: { nombre: true } },
    },
    orderBy: { fechaHora: "desc" },
  });

  const hoyInicio = new Date();
  hoyInicio.setHours(0, 0, 0, 0);
  const registrosHoy = registros.filter((r) => r.fechaHora >= hoyInicio);

  const avesHoy = registrosHoy.length;
  const pesoPromedioHoy =
    registrosHoy.length > 0
      ? registrosHoy.reduce((acc, r) => acc + r.pesoGramos, 0) / registrosHoy.length
      : 0;
  const plantelesActivosHoy = new Set(registrosHoy.map((r) => r.plantelId)).size;

  // Por plantel/galpon/corral/categoria
  type Agregado = { count: number; sumaPeso: number };
  const porCorralMap = new Map<string, Record<CategoriaAve, Agregado>>();
  for (const r of registros) {
    const label = `${r.plantel.codigo} G${r.galpon}-${r.corral}`;
    const entry =
      porCorralMap.get(label) ??
      ({
        MACHO: { count: 0, sumaPeso: 0 },
        HEMBRA: { count: 0, sumaPeso: 0 },
        MEDIANO: { count: 0, sumaPeso: 0 },
      } as Record<CategoriaAve, Agregado>);
    entry[r.categoria].count += 1;
    entry[r.categoria].sumaPeso += r.pesoGramos;
    porCorralMap.set(label, entry);
  }
  const porCorral = Array.from(porCorralMap.entries())
    .map(([label, cats]) => ({
      label,
      MACHO: cats.MACHO.count > 0 ? Math.round(cats.MACHO.sumaPeso / cats.MACHO.count) : null,
      HEMBRA: cats.HEMBRA.count > 0 ? Math.round(cats.HEMBRA.sumaPeso / cats.HEMBRA.count) : null,
      MEDIANO: cats.MEDIANO.count > 0 ? Math.round(cats.MEDIANO.sumaPeso / cats.MEDIANO.count) : null,
    }))
    .slice(0, 20);

  // Última sincronización por verificador
  const syncMap = new Map<string, { nombre: string; ultimaSync: Date; registros: number }>();
  for (const r of registros) {
    const entry = syncMap.get(r.verificadorId) ?? {
      nombre: r.verificador.nombre,
      ultimaSync: r.syncedAt,
      registros: 0,
    };
    entry.registros += 1;
    if (r.syncedAt > entry.ultimaSync) entry.ultimaSync = r.syncedAt;
    syncMap.set(r.verificadorId, entry);
  }
  const ultimaSyncPorVerificador = Array.from(syncMap.values()).sort(
    (a, b) => b.ultimaSync.getTime() - a.ultimaSync.getTime()
  );

  return (
    <div>
      <AutoRefresh />
      <h1 className="mb-1 text-xl font-bold text-slate-900">Peso en planta — Preventa</h1>
      <p className="mb-6 text-sm text-slate-500">
        {user.role === "SUPERVISOR"
          ? "Consolidado en tiempo real de todos los verificadores."
          : "Tus muestreos de peso registrados."}{" "}
        Se actualiza automáticamente cada 20 segundos.
      </p>

      <div className="mb-6">
        <LiveWeights />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="Aves pesadas hoy" value={avesHoy.toLocaleString("es-PE")} />
        <KpiCard label="Peso promedio hoy" value={`${pesoPromedioHoy.toFixed(0)} g`} />
        <KpiCard label="Planteles activos hoy" value={plantelesActivosHoy.toString()} />
      </div>

      <div className="mb-6">
        <PreventaCharts porCorral={porCorral} />
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-3 font-semibold text-slate-900">Última sincronización por verificador</h2>
        {ultimaSyncPorVerificador.length === 0 ? (
          <p className="text-sm text-slate-400">Aún no hay registros sincronizados.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2">Verificador</th>
                <th className="py-2">Registros</th>
                <th className="py-2">Última sincronización</th>
              </tr>
            </thead>
            <tbody>
              {ultimaSyncPorVerificador.map((v) => (
                <tr key={v.nombre} className="border-b border-slate-100 last:border-0">
                  <td className="py-2">{v.nombre}</td>
                  <td className="py-2">{v.registros.toLocaleString("es-PE")}</td>
                  <td className="py-2">{v.ultimaSync.toLocaleString("es-PE")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
