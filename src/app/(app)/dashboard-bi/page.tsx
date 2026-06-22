import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { TendenciaChart, RankingChart } from "./charts";

const NOMBRES_MERMA_PASO7 = [
  "Alas Grado 1°", "Alas Grado 2°", "Alas Grado 3°", "Alas Rota",
  "Pierna Grado 1°", "Pierna Grado 2°", "Pierna Grado 3°", "Pierna Rota",
  "Alas Mutiladas", "Piernas Mutiladas",
];

const UMBRAL_MERMA = { verde: 2, amarillo: 5 };
const UMBRAL_HEMATOMAS = { verde: 5, amarillo: 15 };

const SEMAFORO_BADGE = {
  verde: "bg-emerald-100 text-emerald-700",
  amarillo: "bg-amber-100 text-amber-700",
  rojo: "bg-red-100 text-red-700",
};

const SEMAFORO_HEX = {
  verde: "#1C8A5A",
  amarillo: "#E0A800",
  rojo: "#C41E3A",
};

function pct(num: number, den: number): number {
  return den ? (num / den) * 100 : 0;
}

function semaforo(value: number, umbral: { verde: number; amarillo: number }): "verde" | "amarillo" | "rojo" {
  if (value <= umbral.verde) return "verde";
  if (value <= umbral.amarillo) return "amarillo";
  return "rojo";
}

export default async function DashboardBiPage({
  searchParams,
}: {
  searchParams: Promise<{ clienteId?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "VERIFICADOR") redirect("/jornadas");

  const { clienteId } = await searchParams;

  const where: Prisma.InspeccionWhereInput = clienteId ? { clienteId } : {};

  const [inspecciones, clientes] = await Promise.all([
    prisma.inspeccion.findMany({
      where,
      include: {
        plantel: true,
        defectos: { include: { tipoDefecto: true } },
        evaluacionesLesion: true,
        jornada: { select: { fecha: true } },
      },
      orderBy: { fecha: "asc" },
    }),
    prisma.cliente.findMany({ orderBy: { nombre: "asc" } }),
  ]);

  // Las evaluaciones "solo lesión/pigmentación" no traen censo de selección/merma:
  // se excluyen de esos ratios para no diluirlos con su tamaño de muestra.
  const inspeccionesCompletas = inspecciones.filter((i) => !i.soloLesionPigmentacion);
  const inspeccionesParciales = inspecciones.filter((i) => i.soloLesionPigmentacion);

  const evaluacionesCompletas = inspeccionesCompletas.length;
  const totalUnidades = inspeccionesCompletas.reduce((acc, i) => acc + i.cantidad, 0);

  let totalSeleccionUnid = 0;
  let totalMermaUnid = 0;
  for (const insp of inspeccionesCompletas) {
    for (const d of insp.defectos) {
      if (NOMBRES_MERMA_PASO7.includes(d.tipoDefecto.nombre)) {
        totalMermaUnid += d.unidades;
      } else {
        totalSeleccionUnid += d.unidades;
      }
    }
  }

  const totalHemCon = inspecciones.reduce((acc, i) => acc + (i.hematomasCon ?? 0), 0);
  const totalHemSin = inspecciones.reduce((acc, i) => acc + (i.hematomasSin ?? 0), 0);

  const tempCamionVals = inspecciones.map((i) => i.tempCamion).filter((v): v is number => v != null);
  const tempCamionProm = tempCamionVals.length
    ? tempCamionVals.reduce((a, b) => a + b, 0) / tempCamionVals.length
    : null;

  let pigUnidades = 0;
  let pigSumaNiveles = 0;
  for (const insp of inspecciones) {
    const niveles = [
      insp.pigNivel0, insp.pigNivel1, insp.pigNivel2, insp.pigNivel3,
      insp.pigNivel4, insp.pigNivel5, insp.pigNivel6, insp.pigNivel7,
    ];
    niveles.forEach((cantidad, nivel) => {
      pigUnidades += cantidad;
      pigSumaNiveles += cantidad * nivel;
    });
  }
  const pigmentacionProm = pigUnidades ? pigSumaNiveles / pigUnidades : null;

  // Pododermatitis (almohadillas) y rasguños tienen su propia muestra (EvaluacionLesion.muestra),
  // igual que hematomas: no se dividen por `cantidad`, sino por su propio tamaño de muestra.
  let almohadillasMuestra = 0;
  let almohadillasConLesion = 0;
  let rasgunosMuestra = 0;
  let rasgunosConLesion = 0;
  for (const insp of inspecciones) {
    for (const l of insp.evaluacionesLesion) {
      if (l.categoria === "ALMOHADILLAS") {
        almohadillasMuestra += l.muestra;
        almohadillasConLesion += l.leve + l.grave;
      } else {
        rasgunosMuestra += l.muestra;
        rasgunosConLesion += l.leve + l.grave;
      }
    }
  }
  const pctPododermatitis = pct(almohadillasConLesion, almohadillasMuestra);
  const pctRasgunos = pct(rasgunosConLesion, rasgunosMuestra);

  const pctSeleccion = pct(totalSeleccionUnid, totalUnidades);
  const pctMerma = pct(totalMermaUnid, totalUnidades);
  const pctHematomas = pct(totalHemCon, totalHemCon + totalHemSin);

  // Ranking por plantel
  type PlantelAgg = {
    codigo: string;
    evaluaciones: number;
    cantidad: number;
    seleccionUnid: number;
    mermaUnid: number;
    hemCon: number;
    hemSin: number;
  };
  const plantelMap = new Map<string, PlantelAgg>();
  for (const insp of inspeccionesCompletas) {
    const codigo = insp.plantel?.codigo ?? "Sin plantel";
    const entry =
      plantelMap.get(codigo) ?? { codigo, evaluaciones: 0, cantidad: 0, seleccionUnid: 0, mermaUnid: 0, hemCon: 0, hemSin: 0 };
    entry.evaluaciones += 1;
    entry.cantidad += insp.cantidad;
    entry.hemCon += insp.hematomasCon ?? 0;
    entry.hemSin += insp.hematomasSin ?? 0;
    for (const d of insp.defectos) {
      if (NOMBRES_MERMA_PASO7.includes(d.tipoDefecto.nombre)) entry.mermaUnid += d.unidades;
      else entry.seleccionUnid += d.unidades;
    }
    plantelMap.set(codigo, entry);
  }
  const ranking = Array.from(plantelMap.values())
    .map((p) => ({
      codigo: p.codigo,
      evaluaciones: p.evaluaciones,
      pctSeleccion: pct(p.seleccionUnid, p.cantidad),
      pctMerma: pct(p.mermaUnid, p.cantidad),
      pctHematomas: pct(p.hemCon, p.hemCon + p.hemSin),
    }))
    .sort((a, b) => a.pctMerma - b.pctMerma);

  const rankingChartData = ranking.map((p) => ({
    codigo: p.codigo,
    pctMerma: Number(p.pctMerma.toFixed(2)),
    color: SEMAFORO_HEX[semaforo(p.pctMerma, UMBRAL_MERMA)],
  }));

  // Tendencia en el tiempo (por fecha)
  type FechaAgg = { fecha: string; cantidad: number; seleccionUnid: number; mermaUnid: number; hemCon: number; hemSin: number };
  const fechaMap = new Map<string, FechaAgg>();
  for (const insp of inspeccionesCompletas) {
    const fecha = insp.fecha ?? insp.jornada?.fecha ?? null;
    if (!fecha) continue;
    const key = fecha.toISOString().slice(0, 10);
    const entry = fechaMap.get(key) ?? { fecha: key, cantidad: 0, seleccionUnid: 0, mermaUnid: 0, hemCon: 0, hemSin: 0 };
    entry.cantidad += insp.cantidad;
    entry.hemCon += insp.hematomasCon ?? 0;
    entry.hemSin += insp.hematomasSin ?? 0;
    for (const d of insp.defectos) {
      if (NOMBRES_MERMA_PASO7.includes(d.tipoDefecto.nombre)) entry.mermaUnid += d.unidades;
      else entry.seleccionUnid += d.unidades;
    }
    fechaMap.set(key, entry);
  }
  const tendencia = Array.from(fechaMap.values())
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((f) => ({
      fecha: f.fecha,
      pctSeleccion: Number(pct(f.seleccionUnid, f.cantidad).toFixed(3)),
      pctMerma: Number(pct(f.mermaUnid, f.cantidad).toFixed(3)),
      pctHematomas: Number(pct(f.hemCon, f.hemCon + f.hemSin).toFixed(3)),
    }));

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-slate-900">Indicadores de calidad</h1>
      <p className="mb-6 text-sm text-slate-500">
        Selección, merma, hematomas, pigmentación y condiciones de transporte de todas las inspecciones.
      </p>

      <form className="mb-6 flex flex-wrap items-end gap-2 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <select name="clienteId" defaultValue={clienteId ?? ""} className="input max-w-xs">
          <option value="">Todos los clientes</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
        >
          Filtrar
        </button>
      </form>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Evaluaciones completas" value={evaluacionesCompletas.toString()} />
        <KpiCard label="Unidades evaluadas" value={totalUnidades.toLocaleString("es-PE")} />
        <KpiCard label="% Selección" value={`${pctSeleccion.toFixed(2)}%`} />
        <KpiCard
          label="% Merma"
          value={`${pctMerma.toFixed(2)}%`}
          highlight={semaforo(pctMerma, UMBRAL_MERMA)}
        />
        <KpiCard
          label="% Hematomas"
          value={`${pctHematomas.toFixed(2)}%`}
          highlight={semaforo(pctHematomas, UMBRAL_HEMATOMAS)}
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <KpiCard
          label="Temp. promedio camión"
          value={tempCamionProm != null ? `${tempCamionProm.toFixed(1)} °C` : "Sin datos"}
        />
        <KpiCard
          label="Pigmentación promedio (nivel 0-7)"
          value={pigmentacionProm != null ? pigmentacionProm.toFixed(2) : "Sin datos"}
          sub="Meta: 3.5"
        />
        <KpiCard
          label="% Pododermatitis"
          value={`${pctPododermatitis.toFixed(2)}%`}
          sub="Almohadillas, muestra propia"
        />
        <KpiCard label="% Rasguños" value={`${pctRasgunos.toFixed(2)}%`} sub="Muestra propia" />
        <KpiCard label="Planteles evaluados" value={ranking.length.toString()} />
        <KpiCard
          label="Evaluaciones solo lesión/pigmentación"
          value={inspeccionesParciales.length.toString()}
          sub="No suman a % Selección ni % Merma"
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Tendencia en el tiempo">
          <TendenciaChart data={tendencia} />
        </ChartCard>
        <ChartCard title="Ranking de planteles por % de merma (mejor desempeño arriba)">
          <RankingChart data={rankingChartData} />
        </ChartCard>
      </div>

      <ChartCard title="Detalle por plantel" full>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Plantel</th>
                <th className="px-3 py-2 font-medium">Evaluaciones</th>
                <th className="px-3 py-2 font-medium">% Selección</th>
                <th className="px-3 py-2 font-medium">% Merma</th>
                <th className="px-3 py-2 font-medium">% Hematomas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ranking.map((p) => (
                <tr key={p.codigo} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium text-slate-900">{p.codigo}</td>
                  <td className="px-3 py-2">{p.evaluaciones}</td>
                  <td className="px-3 py-2">{p.pctSeleccion.toFixed(2)}%</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-md px-2 py-0.5 font-semibold ${SEMAFORO_BADGE[semaforo(p.pctMerma, UMBRAL_MERMA)]}`}>
                      {p.pctMerma.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-md px-2 py-0.5 font-semibold ${SEMAFORO_BADGE[semaforo(p.pctHematomas, UMBRAL_HEMATOMAS)]}`}
                    >
                      {p.pctHematomas.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
              {ranking.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                    Aún no hay inspecciones registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ChartCard>
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
  highlight?: "verde" | "amarillo" | "rojo";
}) {
  const color =
    highlight === "rojo"
      ? "text-red-600"
      : highlight === "amarillo"
        ? "text-amber-600"
        : highlight === "verde"
          ? "text-emerald-600"
          : "text-slate-900";
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function ChartCard({ title, children, full }: { title: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 ${full ? "lg:col-span-2" : ""}`}>
      <h2 className="mb-3 font-semibold text-slate-900">{title}</h2>
      {children}
    </div>
  );
}
