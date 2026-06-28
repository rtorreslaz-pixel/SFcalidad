import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { SexoAve } from "@/generated/prisma/enums";
import { TendenciaChart, RankingChart, PigmentacionChart, LesionChart } from "./charts";
import { esDefectoMerma } from "@/lib/defectos-merma";

const UMBRAL_MERMA = { verde: 2, amarillo: 5 };
const UMBRAL_HEMATOMAS = { verde: 5, amarillo: 15 };

// Objetivos del reporte diario de calidad pecuaria (fuente: reporte usado en planta).
const OBJETIVO_SELECCION = 0.6;
const OBJETIVO_PIGMENTACION = { min: 3.0, max: 3.5 };
const OBJETIVO_PODODERMATITIS = 11;
const OBJETIVO_RASGUNOS = 10;

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

// Objetivos del reporte diario: un solo umbral (no hay franja amarilla intermedia).
function semaforoMax(value: number, objetivo: number): "verde" | "rojo" {
  return value <= objetivo ? "verde" : "rojo";
}

function semaforoRango(value: number, min: number, max: number): "verde" | "rojo" {
  return value >= min && value <= max ? "verde" : "rojo";
}

function buildHref(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) sp.set(k, v);
  }
  const qs = sp.toString();
  return qs ? `/dashboard-bi?${qs}` : "/dashboard-bi";
}

function isoDaysAgo(dias: number) {
  return new Date(Date.now() - dias * 86400000).toISOString().slice(0, 10);
}

export default async function DashboardBiPage({
  searchParams,
}: {
  searchParams: Promise<{
    clienteId?: string;
    plantelId?: string;
    desde?: string;
    hasta?: string;
    complexEntity?: string;
    campania?: string;
    galpon?: string;
    sexo?: string;
    corral?: string;
  }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "VERIFICADOR") redirect("/jornadas");
  if (user.role === "COMERCIAL") redirect("/dashboard/preventa");

  const { clienteId, plantelId, desde, hasta, complexEntity, campania, galpon, sexo, corral } = await searchParams;

  const where: Prisma.InspeccionWhereInput = {
    ...(clienteId ? { clienteId } : {}),
    ...(plantelId ? { plantelId } : {}),
    ...(complexEntity ? { complex: { contains: complexEntity } } : {}),
    ...(campania ? { campania: { contains: campania } } : {}),
    ...(galpon ? { galpon: { contains: galpon } } : {}),
    ...(sexo ? { sexo: sexo as SexoAve } : {}),
    ...(corral ? { corral: { contains: corral } } : {}),
  };

  const [inspeccionesSinFecha, clientes, planteles] = await Promise.all([
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
    prisma.plantel.findMany({
      where: clienteId ? { clienteId } : {},
      orderBy: { codigo: "asc" },
    }),
  ]);

  // El horizonte temporal se aplica en memoria porque la fecha "efectiva" de una
  // inspección puede venir del campo legacy `fecha` o de `jornada.fecha`.
  const desdeDate = desde ? new Date(desde) : null;
  const hastaDate = hasta ? new Date(`${hasta}T23:59:59.999`) : null;
  const inspecciones = inspeccionesSinFecha.filter((insp) => {
    if (!desdeDate && !hastaDate) return true;
    const fecha = insp.fecha ?? insp.jornada?.fecha ?? null;
    if (!fecha) return false;
    if (desdeDate && fecha < desdeDate) return false;
    if (hastaDate && fecha > hastaDate) return false;
    return true;
  });

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
      if (esDefectoMerma(d.tipoDefecto.nombre)) {
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
  // El objetivo del reporte diario solo califica el Grado 2 (lesión grave), no leve+grave.
  let almohadillasMuestra = 0;
  let almohadillasGrado2 = 0;
  let rasgunosMuestra = 0;
  let rasgunosGrado2 = 0;
  for (const insp of inspecciones) {
    for (const l of insp.evaluacionesLesion) {
      if (l.categoria === "ALMOHADILLAS") {
        almohadillasMuestra += l.muestra;
        almohadillasGrado2 += l.grave;
      } else {
        rasgunosMuestra += l.muestra;
        rasgunosGrado2 += l.grave;
      }
    }
  }
  const pctPododermatitis = pct(almohadillasGrado2, almohadillasMuestra);
  const pctRasgunos = pct(rasgunosGrado2, rasgunosMuestra);

  const pctSeleccion = pct(totalSeleccionUnid, totalUnidades);
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
      if (esDefectoMerma(d.tipoDefecto.nombre)) entry.mermaUnid += d.unidades;
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

  // Ranking por zona de plantel
  type ZonaAgg = {
    zona: string;
    evaluaciones: number;
    cantidad: number;
    seleccionUnid: number;
    mermaUnid: number;
    hemCon: number;
    hemSin: number;
  };
  const zonaMap = new Map<string, ZonaAgg>();
  for (const insp of inspeccionesCompletas) {
    const zona = insp.plantel?.zona ?? "Sin zona";
    const entry =
      zonaMap.get(zona) ?? { zona, evaluaciones: 0, cantidad: 0, seleccionUnid: 0, mermaUnid: 0, hemCon: 0, hemSin: 0 };
    entry.evaluaciones += 1;
    entry.cantidad += insp.cantidad;
    entry.hemCon += insp.hematomasCon ?? 0;
    entry.hemSin += insp.hematomasSin ?? 0;
    for (const d of insp.defectos) {
      if (NOMBRES_MERMA_PASO7.includes(d.tipoDefecto.nombre)) entry.mermaUnid += d.unidades;
      else entry.seleccionUnid += d.unidades;
    }
    zonaMap.set(zona, entry);
  }
  const rankingZonas = Array.from(zonaMap.values())
    .map((z) => ({
      zona: z.zona,
      evaluaciones: z.evaluaciones,
      pctSeleccion: pct(z.seleccionUnid, z.cantidad),
      pctMerma: pct(z.mermaUnid, z.cantidad),
      pctHematomas: pct(z.hemCon, z.hemCon + z.hemSin),
    }))
    .sort((a, b) => a.pctMerma - b.pctMerma);

  const rankingZonasChartData = rankingZonas.map((z) => ({
    codigo: z.zona,
    pctMerma: Number(z.pctMerma.toFixed(2)),
    color: SEMAFORO_HEX[semaforo(z.pctMerma, UMBRAL_MERMA)],
  }));

  // Tendencia en el tiempo (por fecha). Selección/merma usan solo evaluaciones completas
  // (censo); hematomas, pigmentación y lesión usan todas las inspecciones, igual que sus KPIs.
  type FechaAgg = {
    fecha: string;
    cantidad: number; seleccionUnid: number; mermaUnid: number;
    hemCon: number; hemSin: number;
    pigUnidades: number; pigSuma: number;
    podoMuestra: number; podoGrado2: number;
    rasgMuestra: number; rasgGrado2: number;
  };
  const fechaMap = new Map<string, FechaAgg>();
  function fechaEntry(key: string): FechaAgg {
    let entry = fechaMap.get(key);
    if (!entry) {
      entry = {
        fecha: key, cantidad: 0, seleccionUnid: 0, mermaUnid: 0,
        hemCon: 0, hemSin: 0, pigUnidades: 0, pigSuma: 0,
        podoMuestra: 0, podoGrado2: 0, rasgMuestra: 0, rasgGrado2: 0,
      };
      fechaMap.set(key, entry);
    }
    return entry;
  }
  for (const insp of inspeccionesCompletas) {
    const fecha = insp.fecha ?? insp.jornada?.fecha ?? null;
    if (!fecha) continue;
    const entry = fechaEntry(fecha.toISOString().slice(0, 10));
    entry.cantidad += insp.cantidad;
    for (const d of insp.defectos) {
      if (esDefectoMerma(d.tipoDefecto.nombre)) entry.mermaUnid += d.unidades;
      else entry.seleccionUnid += d.unidades;
    }
  }
  for (const insp of inspecciones) {
    const fecha = insp.fecha ?? insp.jornada?.fecha ?? null;
    if (!fecha) continue;
    const entry = fechaEntry(fecha.toISOString().slice(0, 10));
    entry.hemCon += insp.hematomasCon ?? 0;
    entry.hemSin += insp.hematomasSin ?? 0;
    const niveles = [
      insp.pigNivel0, insp.pigNivel1, insp.pigNivel2, insp.pigNivel3,
      insp.pigNivel4, insp.pigNivel5, insp.pigNivel6, insp.pigNivel7,
    ];
    niveles.forEach((cantidad, nivel) => {
      entry.pigUnidades += cantidad;
      entry.pigSuma += cantidad * nivel;
    });
    for (const l of insp.evaluacionesLesion) {
      if (l.categoria === "ALMOHADILLAS") {
        entry.podoMuestra += l.muestra;
        entry.podoGrado2 += l.grave;
      } else {
        entry.rasgMuestra += l.muestra;
        entry.rasgGrado2 += l.grave;
      }
    }
  }
  const tendencia = Array.from(fechaMap.values())
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((f) => ({
      fecha: f.fecha,
      pctSeleccion: Number(pct(f.seleccionUnid, f.cantidad).toFixed(3)),
      pctMerma: Number(pct(f.mermaUnid, f.cantidad).toFixed(3)),
      pctHematomas: Number(pct(f.hemCon, f.hemCon + f.hemSin).toFixed(3)),
      pigmentacion: f.pigUnidades ? Number((f.pigSuma / f.pigUnidades).toFixed(3)) : null,
      pctPododermatitis: Number(pct(f.podoGrado2, f.podoMuestra).toFixed(3)),
      pctRasgunos: Number(pct(f.rasgGrado2, f.rasgMuestra).toFixed(3)),
    }));

  const quickRanges: { label: string; desde?: string; hasta?: string }[] = [
    { label: "Hoy", desde: isoDaysAgo(0), hasta: isoDaysAgo(0) },
    { label: "Últimos 7 días", desde: isoDaysAgo(7), hasta: isoDaysAgo(0) },
    { label: "Últimos 30 días", desde: isoDaysAgo(30), hasta: isoDaysAgo(0) },
    { label: "Todo", desde: undefined, hasta: undefined },
  ];
  const hayFiltros = Boolean(
    clienteId || plantelId || desde || hasta || complexEntity || campania || galpon || sexo || corral
  );

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-slate-900">Indicadores de calidad</h1>
      <p className="mb-6 text-sm text-slate-500">
        Selección, merma, hematomas, pigmentación y condiciones de transporte de todas las inspecciones.
      </p>

      <form className="mb-3 flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Cliente</label>
          <select name="clienteId" defaultValue={clienteId ?? ""} className="input max-w-xs">
            <option value="">Todos los clientes</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Plantel</label>
          <select name="plantelId" defaultValue={plantelId ?? ""} className="input max-w-xs">
            <option value="">Todos los planteles</option>
            {planteles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.codigo}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Desde</label>
          <input type="date" name="desde" defaultValue={desde ?? ""} className="input" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Hasta</label>
          <input type="date" name="hasta" defaultValue={hasta ?? ""} className="input" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Complex Entity</label>
          <input
            type="text"
            name="complexEntity"
            placeholder="Ej: P289-2401-11-M-A"
            defaultValue={complexEntity ?? ""}
            className="input max-w-xs"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Campaña</label>
          <input type="text" name="campania" placeholder="Ej: 2401" defaultValue={campania ?? ""} className="input w-24" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Galpón</label>
          <input type="text" name="galpon" placeholder="Ej: 11" defaultValue={galpon ?? ""} className="input w-20" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Sexo</label>
          <select name="sexo" defaultValue={sexo ?? ""} className="input w-32">
            <option value="">Todos</option>
            <option value="MACHO">Macho</option>
            <option value="HEMBRA">Hembra</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Corral</label>
          <input type="text" name="corral" placeholder="Ej: A" defaultValue={corral ?? ""} className="input w-20" />
        </div>
        <button
          type="submit"
          className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
        >
          Filtrar
        </button>
        {hayFiltros && (
          <a href="/dashboard-bi" className="rounded-md px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100">
            Limpiar filtros
          </a>
        )}
      </form>

      <div className="mb-6 flex flex-wrap gap-2">
        {quickRanges.map((r) => {
          const activo = (r.desde ?? "") === (desde ?? "") && (r.hasta ?? "") === (hasta ?? "");
          return (
            <a
              key={r.label}
              href={buildHref({
                clienteId,
                plantelId,
                desde: r.desde,
                hasta: r.hasta,
                complexEntity,
                campania,
                galpon,
                sexo,
                corral,
              })}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                activo ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {r.label}
            </a>
          );
        })}
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Evaluaciones completas" value={evaluacionesCompletas.toString()} />
        <KpiCard label="Unidades evaluadas" value={totalUnidades.toLocaleString("es-PE")} />
        <KpiCard
          label="% Selección"
          value={`${pctSeleccion.toFixed(2)}%`}
          highlight={semaforoMax(pctSeleccion, OBJETIVO_SELECCION)}
          sub={`Objetivo: ≤ ${OBJETIVO_SELECCION.toFixed(2)}%`}
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
          highlight={pigmentacionProm != null ? semaforoRango(pigmentacionProm, OBJETIVO_PIGMENTACION.min, OBJETIVO_PIGMENTACION.max) : undefined}
          sub={`Objetivo: ${OBJETIVO_PIGMENTACION.min} - ${OBJETIVO_PIGMENTACION.max}`}
        />
        <KpiCard
          label="% Pododermatitis (Grado 2)"
          value={`${pctPododermatitis.toFixed(2)}%`}
          highlight={semaforoMax(pctPododermatitis, OBJETIVO_PODODERMATITIS)}
          sub={`Objetivo: ≤ ${OBJETIVO_PODODERMATITIS}% · muestra propia`}
        />
        <KpiCard
          label="% Rasguños (Grado 2)"
          value={`${pctRasgunos.toFixed(2)}%`}
          highlight={semaforoMax(pctRasgunos, OBJETIVO_RASGUNOS)}
          sub={`Objetivo: ≤ ${OBJETIVO_RASGUNOS}% · muestra propia`}
        />
        <KpiCard label="Planteles evaluados" value={ranking.length.toString()} />
        <KpiCard
          label="Evaluaciones solo lesión/pigmentación"
          value={inspeccionesParciales.length.toString()}
          sub="No suman a % Selección ni % Merma"
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Tendencia en el tiempo · Selección, merma y hematomas">
          <TendenciaChart data={tendencia} objetivoSeleccion={OBJETIVO_SELECCION} />
        </ChartCard>
        <ChartCard title="Ranking de planteles por % de merma (mejor desempeño arriba)">
          <div className="max-h-[60vh] overflow-y-auto">
            <RankingChart data={rankingChartData} />
          </div>
        </ChartCard>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6">
        <ChartCard title="Ranking de zonas por % de merma (mejor desempeño arriba)" full>
          <div className="max-h-[60vh] overflow-y-auto">
            <RankingChart data={rankingZonasChartData} />
          </div>
        </ChartCard>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Tendencia en el tiempo · Pigmentación promedio">
          <PigmentacionChart data={tendencia} objetivo={OBJETIVO_PIGMENTACION} />
        </ChartCard>
        <ChartCard title="Tendencia en el tiempo · Pododermatitis y rasguños (Grado 2)">
          <LesionChart data={tendencia} objetivoPodo={OBJETIVO_PODODERMATITIS} objetivoRasg={OBJETIVO_RASGUNOS} />
        </ChartCard>
      </div>

      <ChartCard title="Detalle por plantel" full>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Plantel</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Evaluaciones</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">% Selección</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">% Merma</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">% Hematomas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ranking.map((p) => (
                <tr key={p.codigo} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-900">{p.codigo}</td>
                  <td className="whitespace-nowrap px-3 py-2">{p.evaluaciones}</td>
                  <td className="whitespace-nowrap px-3 py-2">{p.pctSeleccion.toFixed(2)}%</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <span className={`rounded-md px-2 py-0.5 font-semibold ${SEMAFORO_BADGE[semaforo(p.pctMerma, UMBRAL_MERMA)]}`}>
                      {p.pctMerma.toFixed(2)}%
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
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

      <ChartCard title="Detalle por zona" full>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Zona</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Evaluaciones</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">% Selección</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">% Merma</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">% Hematomas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rankingZonas.map((z) => (
                <tr key={z.zona} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-900">{z.zona}</td>
                  <td className="whitespace-nowrap px-3 py-2">{z.evaluaciones}</td>
                  <td className="whitespace-nowrap px-3 py-2">{z.pctSeleccion.toFixed(2)}%</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <span className={`rounded-md px-2 py-0.5 font-semibold ${SEMAFORO_BADGE[semaforo(z.pctMerma, UMBRAL_MERMA)]}`}>
                      {z.pctMerma.toFixed(2)}%
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <span
                      className={`rounded-md px-2 py-0.5 font-semibold ${SEMAFORO_BADGE[semaforo(z.pctHematomas, UMBRAL_HEMATOMAS)]}`}
                    >
                      {z.pctHematomas.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
              {rankingZonas.length === 0 && (
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
