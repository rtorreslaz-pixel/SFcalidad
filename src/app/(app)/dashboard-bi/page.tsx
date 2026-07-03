import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { SexoAve } from "@/generated/prisma/enums";
import { TendenciaChart, RankingChart, PigmentacionChart, LesionChart, ClienteChart, DefectoChart } from "./charts";
import { esDefectoMerma } from "@/lib/defectos-merma";
import { getISOWeek } from "@/lib/calc";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// Techo de eje Y realista: percentil 95 con 20% de aire, redondeado a múltiplo de 5,
// para que un dato atípico (ej. 80%) no aplaste el rango normal. floor asegura que las
// líneas de objetivo queden visibles.
function techoRealista(values: number[], floor: number): number {
  const v = values.filter((x) => Number.isFinite(x) && x > 0).sort((a, b) => a - b);
  if (v.length === 0) return floor;
  const p95 = v[Math.min(v.length - 1, Math.floor(v.length * 0.95))];
  const conAire = Math.ceil((p95 * 1.2) / 5) * 5;
  return Math.max(floor, conAire);
}

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

export default async function DashboardBiPage({
  searchParams,
}: {
  searchParams: Promise<{
    clienteId?: string;
    plantelId?: string;
    zona?: string;
    subZona?: string;
    anio?: string;
    mes?: string;
    semana?: string;
    dia?: string;
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
  if (user.role === "COMERCIAL") redirect("/dashboard/pesaje");

  const { clienteId, plantelId, zona, subZona, anio, mes, semana, dia, complexEntity, campania, galpon, sexo, corral } =
    await searchParams;

  const where: Prisma.InspeccionWhereInput = {
    ...(clienteId ? { clienteId } : {}),
    ...(plantelId ? { plantelId } : {}),
    ...(complexEntity ? { complex: { contains: complexEntity } } : {}),
    ...(campania ? { campania: { contains: campania } } : {}),
    ...(galpon ? { galpon: { contains: galpon } } : {}),
    ...(sexo ? { sexo: sexo as SexoAve } : {}),
    ...(corral ? { corral: { contains: corral } } : {}),
    ...(zona || subZona
      ? { plantel: { is: { ...(zona ? { zona } : {}), ...(subZona ? { subZona } : {}) } } }
      : {}),
  };

  const [inspeccionesSinFecha, clientes, planteles, zonasRaw, subZonasRaw] = await Promise.all([
    prisma.inspeccion.findMany({
      where,
      include: {
        plantel: true,
        cliente: { select: { nombre: true } },
        defectos: { include: { tipoDefecto: true } },
        evaluacionesLesion: true,
        jornada: { select: { fecha: true, cliente: { select: { nombre: true } } } },
      },
      orderBy: { fecha: "asc" },
    }),
    prisma.cliente.findMany({ orderBy: { nombre: "asc" } }),
    prisma.plantel.findMany({
      where: clienteId ? { clienteId } : {},
      orderBy: { codigo: "asc" },
    }),
    prisma.plantel.findMany({
      where: { zona: { not: null } },
      select: { zona: true },
      distinct: ["zona"],
      orderBy: { zona: "asc" },
    }),
    prisma.plantel.findMany({
      where: { subZona: { not: null } },
      select: { subZona: true },
      distinct: ["subZona"],
      orderBy: { subZona: "asc" },
    }),
  ]);

  const zonas = zonasRaw.map((z) => z.zona).filter((z): z is string => !!z);
  const subZonas = subZonasRaw.map((s) => s.subZona).filter((s): s is string => !!s);

  // El período se aplica en memoria sobre la fecha "efectiva" (campo legacy `fecha`
  // o `jornada.fecha`), extrayéndola en UTC para calzar con el filtro de día ISO.
  const anioNum = anio ? Number(anio) : null;
  const mesNum = mes ? Number(mes) : null;
  const semanaNum = semana ? Number(semana) : null;
  const hayPeriodo = Boolean(anioNum || mesNum || semanaNum || dia);
  const inspecciones = inspeccionesSinFecha.filter((insp) => {
    if (!hayPeriodo) return true;
    const fecha = insp.fecha ?? insp.jornada?.fecha ?? null;
    if (!fecha) return false;
    if (anioNum && fecha.getUTCFullYear() !== anioNum) return false;
    if (mesNum && fecha.getUTCMonth() + 1 !== mesNum) return false;
    if (semanaNum && getISOWeek(fecha) !== semanaNum) return false;
    if (dia && fecha.toISOString().slice(0, 10) !== dia) return false;
    return true;
  });

  // Años presentes en los datos (para el selector), más reciente primero.
  const aniosDisponibles = Array.from(
    new Set(
      inspeccionesSinFecha
        .map((i) => (i.fecha ?? i.jornada?.fecha ?? null)?.getUTCFullYear())
        .filter((y): y is number => !!y)
    )
  ).sort((a, b) => b - a);

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
    .sort((a, b) => b.pctMerma - a.pctMerma);

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
      if (esDefectoMerma(d.tipoDefecto.nombre)) entry.mermaUnid += d.unidades;
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

  // Por cliente: % de selección (usa solo evaluaciones completas, igual que el KPI de selección)
  const clienteMap = new Map<string, { seleccionUnid: number; cantidad: number }>();
  for (const insp of inspeccionesCompletas) {
    const nombre = insp.cliente?.nombre ?? insp.jornada?.cliente?.nombre ?? "Sin cliente";
    const entry = clienteMap.get(nombre) ?? { seleccionUnid: 0, cantidad: 0 };
    entry.cantidad += insp.cantidad;
    for (const d of insp.defectos) {
      if (!esDefectoMerma(d.tipoDefecto.nombre)) entry.seleccionUnid += d.unidades;
    }
    clienteMap.set(nombre, entry);
  }
  const porCliente = Array.from(clienteMap.entries())
    .map(([cliente, v]) => ({ cliente, pctSeleccion: Number(pct(v.seleccionUnid, v.cantidad).toFixed(2)) }))
    .sort((a, b) => b.pctSeleccion - a.pctSeleccion);

  // Top 10 tipos de defecto por unidades (evaluaciones completas)
  const defectoMap = new Map<string, number>();
  for (const insp of inspeccionesCompletas) {
    for (const d of insp.defectos) {
      defectoMap.set(d.tipoDefecto.nombre, (defectoMap.get(d.tipoDefecto.nombre) ?? 0) + d.unidades);
    }
  }
  const porDefecto = Array.from(defectoMap.entries())
    .map(([defecto, unidades]) => ({ defecto, unidades }))
    .sort((a, b) => b.unidades - a.unidades)
    .slice(0, 10);

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

  // Techos de eje Y realistas (evitan que un dato atípico lleve el eje a 100%).
  const tendenciaYMax = techoRealista(
    tendencia.flatMap((t) => [t.pctSeleccion, t.pctHematomas]),
    5
  );
  const lesionYMax = techoRealista(
    tendencia.flatMap((t) => [t.pctPododermatitis, t.pctRasgunos]),
    Math.ceil(Math.max(OBJETIVO_PODODERMATITIS, OBJETIVO_RASGUNOS) * 1.2)
  );

  const hayFiltros = Boolean(
    clienteId || plantelId || zona || subZona || anio || mes || semana || dia ||
    complexEntity || campania || galpon || sexo || corral
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Indicadores de calidad: selección, hematomas, pigmentación, lesiones y transporte.
          </p>
        </div>
        {hayFiltros && (
          <a
            href="/dashboard-bi"
            className="flex-none rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Limpiar filtros
          </a>
        )}
      </div>

      {/* ---- Filtros de período y cliente (aplican a todos los indicadores) ---- */}
      <form className="mb-6 flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        {/* Preserva la segmentación por zona/subzona/plantel al filtrar por período */}
        {plantelId && <input type="hidden" name="plantelId" value={plantelId} />}
        {zona && <input type="hidden" name="zona" value={zona} />}
        {subZona && <input type="hidden" name="subZona" value={subZona} />}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Año</label>
          <select name="anio" defaultValue={anio ?? ""} className="input w-28">
            <option value="">Todos</option>
            {aniosDisponibles.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Cliente</label>
          <select name="clienteId" defaultValue={clienteId ?? ""} className="input max-w-xs">
            <option value="">Todos los clientes</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Mes</label>
          <select name="mes" defaultValue={mes ?? ""} className="input w-36">
            <option value="">Todos</option>
            {MESES.map((nombre, i) => (
              <option key={nombre} value={i + 1}>{nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Semana (ISO)</label>
          <input type="number" name="semana" min={1} max={53} placeholder="1-53" defaultValue={semana ?? ""} className="input w-24" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Día</label>
          <input type="date" name="dia" defaultValue={dia ?? ""} className="input" />
        </div>
        <button
          type="submit"
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover"
        >
          Filtrar
        </button>
        <details className="w-full">
          <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-700">
            Filtros avanzados (Complex, Campaña, Galpón, Sexo, Corral)
          </summary>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Complex Entity</label>
              <input type="text" name="complexEntity" placeholder="Ej: P289-2401-11-M-A" defaultValue={complexEntity ?? ""} className="input max-w-xs" />
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
          </div>
        </details>
      </form>

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

      <div className="mb-6 grid grid-cols-1 gap-6">
        <ChartCard title="Tendencia en el tiempo · Selección y hematomas" full>
          <TendenciaChart data={tendencia} objetivoSeleccion={OBJETIVO_SELECCION} yMax={tendenciaYMax} />
        </ChartCard>
      </div>

      {/* ---- Segmentación por zona, subzona y plantel (para el ranking de abajo) ---- */}
      <form className="mb-3 flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        {/* Preserva el período/cliente al segmentar por zona/plantel */}
        {anio && <input type="hidden" name="anio" value={anio} />}
        {mes && <input type="hidden" name="mes" value={mes} />}
        {semana && <input type="hidden" name="semana" value={semana} />}
        {dia && <input type="hidden" name="dia" value={dia} />}
        {clienteId && <input type="hidden" name="clienteId" value={clienteId} />}
        {complexEntity && <input type="hidden" name="complexEntity" value={complexEntity} />}
        {campania && <input type="hidden" name="campania" value={campania} />}
        {galpon && <input type="hidden" name="galpon" value={galpon} />}
        {sexo && <input type="hidden" name="sexo" value={sexo} />}
        {corral && <input type="hidden" name="corral" value={corral} />}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Zona</label>
          <select name="zona" defaultValue={zona ?? ""} className="input w-40">
            <option value="">Todas las zonas</option>
            {zonas.map((z) => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Subzona</label>
          <select name="subZona" defaultValue={subZona ?? ""} className="input w-40">
            <option value="">Todas las subzonas</option>
            {subZonas.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Plantel</label>
          <select name="plantelId" defaultValue={plantelId ?? ""} className="input w-40">
            <option value="">Todos los planteles</option>
            {planteles.map((p) => (
              <option key={p.id} value={p.id}>{p.codigo}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover"
        >
          Filtrar
        </button>
      </form>

      <div className="mb-6 grid grid-cols-1 gap-6">
        <ChartCard title="Ranking de planteles por % de merma (mayor a menor)" full>
          <div className="max-h-[60vh] overflow-y-auto">
            <RankingChart data={rankingChartData} />
          </div>
        </ChartCard>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="% Selección por cliente">
          <ClienteChart data={porCliente} objetivo={OBJETIVO_SELECCION} />
        </ChartCard>
        <ChartCard title="Top 10 defectos (unidades)">
          <DefectoChart data={porDefecto} />
        </ChartCard>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Tendencia en el tiempo · Pigmentación promedio">
          <PigmentacionChart data={tendencia} objetivo={OBJETIVO_PIGMENTACION} />
        </ChartCard>
        <ChartCard title="Tendencia en el tiempo · Pododermatitis y rasguños (Grado 2)">
          <LesionChart data={tendencia} objetivoPodo={OBJETIVO_PODODERMATITIS} objetivoRasg={OBJETIVO_RASGUNOS} yMax={lesionYMax} />
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
