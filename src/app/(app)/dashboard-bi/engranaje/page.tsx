import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { CategoriaAve } from "@/generated/prisma/enums";
import { buildComplexEntity } from "@/lib/complex-entity";
import { esDefectoMerma } from "@/lib/defectos-merma";
import { ComparativoCalidadChart, type PuntoComparativo } from "./charts";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const UMBRAL_HEMATOMAS = { verde: 5, amarillo: 15 };
const OBJETIVO_SELECCION = 0.6;
const OBJETIVO_PODODERMATITIS = 11;
const OBJETIVO_RASGUNOS = 10;

function pct(num: number, den: number): number {
  return den ? (num / den) * 100 : 0;
}

function semaforo(value: number, umbral: { verde: number; amarillo: number }): "verde" | "amarillo" | "rojo" {
  if (value <= umbral.verde) return "verde";
  if (value <= umbral.amarillo) return "amarillo";
  return "rojo";
}

function semaforoMax(value: number, objetivo: number): "verde" | "rojo" {
  return value <= objetivo ? "verde" : "rojo";
}

const SEMAFORO_BADGE = {
  verde: "bg-emerald-100 text-emerald-700",
  amarillo: "bg-amber-100 text-amber-700",
  rojo: "bg-red-100 text-red-700",
};

type LoteLabel = {
  plantelCodigo: string;
  campania: string | null;
  galpon: string;
  corral: string;
  categoria: string;
};

// El cruce se hace sobre los valores estructurados vigentes de cada registro (plantel,
// campaña, galpón, corral, categoría/sexo) -- nunca sobre la columna `complex` ya congelada
// en Inspeccion/RegistroPesoPreventa. Esa columna existe solo para mostrarse como texto; si
// se usara para cruzar, un registro viejo con formato distinto (o un Plantel renombrado
// después) dejaría de cruzar en silencio aunque sus datos vigentes sí coincidan.
//
// Las piezas núcleo (plantel, galpón, corral, categoría) deben estar completas para
// intentar el cruce -- una clave parcial (p.ej. solo galpón+corral sin plantel) podría
// mezclar lotes de planteles distintos sin querer. La campaña sí puede faltar: su ausencia
// es consistente en ambos lados cuando aplica.
function loteKeyAndLabel(parts: {
  plantelCodigo: string | null | undefined;
  campania: string | null | undefined;
  galpon: string | null | undefined;
  categoria: string | null | undefined;
  corral: string | null | undefined;
}): { key: string; label: LoteLabel } | null {
  const { plantelCodigo, campania, galpon, categoria, corral } = parts;
  if (!plantelCodigo || !galpon || !categoria || !corral) return null;
  const key = buildComplexEntity({
    plantelCodigo,
    campania: campania ?? null,
    galpon,
    categoria: categoria as CategoriaAve,
    corral,
  });
  if (!key) return null;
  return { key, label: { plantelCodigo, campania: campania ?? null, galpon, corral, categoria } };
}

// Calidad evaluada en cliente (Inspeccion), agregada por lote -- mismas fórmulas que
// dashboard-bi (% Selección sobre defectos no-merma, % Hematomas sobre con+sin, pododermatitis
// y rasguños sobre su propia muestra de EvaluacionLesion, pigmentación como promedio ponderado).
type CalidadClienteAgg = LoteLabel & {
  evaluaciones: number;
  cantidad: number;
  seleccionUnid: number;
  hemCon: number;
  hemSin: number;
  podoMuestra: number;
  podoGrado2: number;
  rasgMuestra: number;
  rasgGrado2: number;
  pigUnidades: number;
  pigSuma: number;
};

// Calidad evaluada en granja, agregada por lote -- a partir de los campos opcionales por ave
// en RegistroPesoPreventa (no todas las aves pesadas se evalúan, solo una sub-muestra).
type GranjaAgg = LoteLabel & {
  avesPesadas: number;
  sumaPesoGramos: number;
  hemConGranja: number;
  hemEvalGranja: number;
  seleccionConGranja: number;
  seleccionEvalGranja: number;
  podoGrado2Granja: number;
  podoEvalGranja: number;
  rasgGrado2Granja: number;
  rasgEvalGranja: number;
  pigSumaGranja: number;
  pigEvalGranja: number;
};

export default async function EngranajePage({
  searchParams,
}: {
  searchParams: Promise<{ clienteId?: string; plantelId?: string; desde?: string; hasta?: string; todo?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "VERIFICADOR") redirect("/jornadas");
  if (user.role === "COMERCIAL") redirect("/dashboard/pesaje");

  const { clienteId, plantelId, desde, hasta, todo } = await searchParams;
  const verTodo = todo === "1";

  // Rango de fechas a nivel BD para no cargar todo el historial de ambas tablas.
  // Por defecto (sin desde/hasta) = mes del registro de calidad más reciente
  // (mes en curso, o el anterior si aquel está vacío). ?todo=1 muestra todo.
  let dbDesde: Date | null = null;
  let dbHasta: Date | null = null;
  let etiquetaMes: string | null = null;
  if (!verTodo) {
    if (desde || hasta) {
      dbDesde = desde ? new Date(desde) : null;
      dbHasta = hasta ? new Date(`${hasta}T23:59:59.999`) : null;
    } else {
      const ultimo = await prisma.inspeccion.findFirst({
        where: { fecha: { not: null } },
        orderBy: { fecha: "desc" },
        select: { fecha: true },
      });
      const base = ultimo?.fecha ?? new Date();
      const y = base.getUTCFullYear();
      const m = base.getUTCMonth();
      dbDesde = new Date(Date.UTC(y, m, 1));
      dbHasta = new Date(Date.UTC(y, m + 1, 1) - 1);
      etiquetaMes = `${MESES[m]} ${y}`;
    }
  }
  const rangoFecha =
    dbDesde || dbHasta ? { ...(dbDesde ? { gte: dbDesde } : {}), ...(dbHasta ? { lte: dbHasta } : {}) } : null;

  const whereInspeccion: Prisma.InspeccionWhereInput = {
    ...(clienteId ? { clienteId } : {}),
    ...(plantelId ? { plantelId } : {}),
    ...(rangoFecha
      ? { OR: [{ fecha: rangoFecha }, { AND: [{ fecha: null }, { jornada: { is: { fecha: rangoFecha } } }] }] }
      : {}),
  };
  const wherePeso: Prisma.RegistroPesoPreventaWhereInput = {
    ...(clienteId ? { plantel: { clienteId } } : {}),
    ...(plantelId ? { plantelId } : {}),
    ...(rangoFecha ? { fechaHora: rangoFecha } : {}),
  };

  const [inspeccionesSinFecha, registrosPesoSinFecha, clientes, planteles] = await Promise.all([
    prisma.inspeccion.findMany({
      where: whereInspeccion,
      include: {
        plantel: { select: { codigo: true } },
        defectos: { include: { tipoDefecto: true } },
        evaluacionesLesion: true,
        jornada: { select: { fecha: true } },
      },
      orderBy: { fecha: "asc" },
    }),
    prisma.registroPesoPreventa.findMany({
      where: wherePeso,
      include: { plantel: { select: { codigo: true } } },
      orderBy: { fechaHora: "asc" },
    }),
    prisma.cliente.findMany({ orderBy: { nombre: "asc" } }),
    prisma.plantel.findMany({
      where: clienteId ? { clienteId } : {},
      orderBy: { codigo: "asc" },
    }),
  ]);

  const desdeDate = desde ? new Date(desde) : null;
  const hastaDate = hasta ? new Date(`${hasta}T23:59:59.999`) : null;

  // El horizonte temporal de Inspeccion se aplica en memoria porque su fecha "efectiva"
  // puede venir del campo legacy `fecha` o de `jornada.fecha` (mismo criterio que dashboard-bi).
  const inspecciones = inspeccionesSinFecha.filter((insp) => {
    if (!desdeDate && !hastaDate) return true;
    const fecha = insp.fecha ?? insp.jornada?.fecha ?? null;
    if (!fecha) return false;
    if (desdeDate && fecha < desdeDate) return false;
    if (hastaDate && fecha > hastaDate) return false;
    return true;
  });
  const registrosPeso = registrosPesoSinFecha.filter((r) => {
    if (desdeDate && r.fechaHora < desdeDate) return false;
    if (hastaDate && r.fechaHora > hastaDate) return false;
    return true;
  });

  const calidadMap = new Map<string, CalidadClienteAgg>();
  function calidadEntry(key: string, label: LoteLabel): CalidadClienteAgg {
    let entry = calidadMap.get(key);
    if (!entry) {
      entry = {
        ...label,
        evaluaciones: 0,
        cantidad: 0,
        seleccionUnid: 0,
        hemCon: 0,
        hemSin: 0,
        podoMuestra: 0,
        podoGrado2: 0,
        rasgMuestra: 0,
        rasgGrado2: 0,
        pigUnidades: 0,
        pigSuma: 0,
      };
      calidadMap.set(key, entry);
    }
    return entry;
  }
  let inspeccionesSinDatosParaCarear = 0;
  for (const insp of inspecciones) {
    const matched = loteKeyAndLabel({
      plantelCodigo: insp.plantel?.codigo,
      campania: insp.campania,
      galpon: insp.galpon,
      categoria: insp.sexo,
      corral: insp.corral,
    });
    if (!matched) {
      inspeccionesSinDatosParaCarear += 1;
      continue;
    }
    const entry = calidadEntry(matched.key, matched.label);
    entry.evaluaciones += 1;
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
    // Igual que en dashboard-bi: las evaluaciones "solo lesión/pigmentación" no traen censo
    // de selección, así que no se suman a ese contador (sí a hematomas, lesiones y evaluaciones).
    if (!insp.soloLesionPigmentacion) {
      entry.cantidad += insp.cantidad;
      for (const d of insp.defectos) {
        if (!esDefectoMerma(d.tipoDefecto.nombre)) entry.seleccionUnid += d.unidades;
      }
    }
  }

  const granjaMap = new Map<string, GranjaAgg>();
  function granjaEntry(key: string, label: LoteLabel): GranjaAgg {
    let entry = granjaMap.get(key);
    if (!entry) {
      entry = {
        ...label,
        avesPesadas: 0,
        sumaPesoGramos: 0,
        hemConGranja: 0,
        hemEvalGranja: 0,
        seleccionConGranja: 0,
        seleccionEvalGranja: 0,
        podoGrado2Granja: 0,
        podoEvalGranja: 0,
        rasgGrado2Granja: 0,
        rasgEvalGranja: 0,
        pigSumaGranja: 0,
        pigEvalGranja: 0,
      };
      granjaMap.set(key, entry);
    }
    return entry;
  }
  let registrosPesoSinDatosParaCarear = 0;
  for (const r of registrosPeso) {
    const matched = loteKeyAndLabel({
      plantelCodigo: r.plantel.codigo,
      campania: r.campania,
      galpon: r.galpon,
      categoria: r.categoria,
      corral: r.corral,
    });
    if (!matched) {
      registrosPesoSinDatosParaCarear += 1;
      continue;
    }
    const entry = granjaEntry(matched.key, matched.label);
    entry.avesPesadas += 1;
    entry.sumaPesoGramos += r.pesoGramos;
    if (r.tieneHematoma !== null) {
      entry.hemEvalGranja += 1;
      if (r.tieneHematoma) entry.hemConGranja += 1;
    }
    if (r.tieneDefectoSeleccion !== null) {
      entry.seleccionEvalGranja += 1;
      if (r.tieneDefectoSeleccion) entry.seleccionConGranja += 1;
    }
    if (r.gradoPododermatitis !== null) {
      entry.podoEvalGranja += 1;
      if (r.gradoPododermatitis === 2) entry.podoGrado2Granja += 1;
    }
    if (r.gradoRasguno !== null) {
      entry.rasgEvalGranja += 1;
      if (r.gradoRasguno === 2) entry.rasgGrado2Granja += 1;
    }
    if (r.pigmentacion !== null) {
      entry.pigEvalGranja += 1;
      entry.pigSumaGranja += r.pigmentacion;
    }
  }

  type FilaEngranaje = {
    key: string;
    label: LoteLabel;
    pesoPromedioGramos: number | null;
    avesPesadas: number;
    avesConCalidadGranja: number;
    evaluacionesCalidadCliente: number;
    estado: "cruzado" | "solo-granja" | "solo-cliente";
    granja: GranjaAgg | null;
    cliente: CalidadClienteAgg | null;
    pctHematomasGranja: number | null;
    pctHematomasCliente: number | null;
    pctSeleccionGranja: number | null;
    pctSeleccionCliente: number | null;
    pctPodoGranja: number | null;
    pctPodoCliente: number | null;
    pctRasgGranja: number | null;
    pctRasgCliente: number | null;
    pigGranja: number | null;
    pigCliente: number | null;
  };
  const todasLasClaves = new Set<string>([...calidadMap.keys(), ...granjaMap.keys()]);
  const filas: FilaEngranaje[] = Array.from(todasLasClaves).map((key) => {
    const cliente = calidadMap.get(key) ?? null;
    const granja = granjaMap.get(key) ?? null;
    const label = cliente ?? (granja as LoteLabel);
    return {
      key,
      label,
      pesoPromedioGramos: granja ? granja.sumaPesoGramos / granja.avesPesadas : null,
      avesPesadas: granja?.avesPesadas ?? 0,
      avesConCalidadGranja: granja?.hemEvalGranja ?? 0,
      evaluacionesCalidadCliente: cliente?.evaluaciones ?? 0,
      estado: cliente && granja ? "cruzado" : granja ? "solo-granja" : "solo-cliente",
      granja,
      cliente,
      pctHematomasGranja: granja && granja.hemEvalGranja ? pct(granja.hemConGranja, granja.hemEvalGranja) : null,
      pctHematomasCliente: cliente ? pct(cliente.hemCon, cliente.hemCon + cliente.hemSin) : null,
      pctSeleccionGranja:
        granja && granja.seleccionEvalGranja ? pct(granja.seleccionConGranja, granja.seleccionEvalGranja) : null,
      pctSeleccionCliente: cliente ? pct(cliente.seleccionUnid, cliente.cantidad) : null,
      pctPodoGranja: granja && granja.podoEvalGranja ? pct(granja.podoGrado2Granja, granja.podoEvalGranja) : null,
      pctPodoCliente: cliente ? pct(cliente.podoGrado2, cliente.podoMuestra) : null,
      pctRasgGranja: granja && granja.rasgEvalGranja ? pct(granja.rasgGrado2Granja, granja.rasgEvalGranja) : null,
      pctRasgCliente: cliente ? pct(cliente.rasgGrado2, cliente.rasgMuestra) : null,
      pigGranja: granja && granja.pigEvalGranja ? granja.pigSumaGranja / granja.pigEvalGranja : null,
      pigCliente: cliente && cliente.pigUnidades ? cliente.pigSuma / cliente.pigUnidades : null,
    };
  });

  const estadoOrden: Record<FilaEngranaje["estado"], number> = { cruzado: 0, "solo-granja": 1, "solo-cliente": 2 };
  filas.sort((a, b) => {
    if (estadoOrden[a.estado] !== estadoOrden[b.estado]) return estadoOrden[a.estado] - estadoOrden[b.estado];
    return a.key.localeCompare(b.key);
  });

  const lotesCruzados = filas.filter((f) => f.estado === "cruzado");
  const lotesSoloGranja = filas.filter((f) => f.estado === "solo-granja");
  const lotesSoloCliente = filas.filter((f) => f.estado === "solo-cliente");
  const avesConCalidadGranjaTotal = registrosPeso.filter((r) => r.tieneHematoma !== null).length;

  // Comparativo agregado sobre lotes cruzados: se suman los conteos crudos de granja y de
  // cliente de ese subconjunto de lotes (no se promedian los % de cada lote), para que el
  // resultado sea la tasa real combinada y no se distorsione por lotes con muestras chicas.
  const aggGranja = lotesCruzados.reduce(
    (acc, f) => {
      const g = f.granja!;
      acc.hemCon += g.hemConGranja;
      acc.hemEval += g.hemEvalGranja;
      acc.seleccionCon += g.seleccionConGranja;
      acc.seleccionEval += g.seleccionEvalGranja;
      acc.podoGrado2 += g.podoGrado2Granja;
      acc.podoEval += g.podoEvalGranja;
      acc.rasgGrado2 += g.rasgGrado2Granja;
      acc.rasgEval += g.rasgEvalGranja;
      acc.pigSuma += g.pigSumaGranja;
      acc.pigEval += g.pigEvalGranja;
      return acc;
    },
    { hemCon: 0, hemEval: 0, seleccionCon: 0, seleccionEval: 0, podoGrado2: 0, podoEval: 0, rasgGrado2: 0, rasgEval: 0, pigSuma: 0, pigEval: 0 }
  );
  const aggCliente = lotesCruzados.reduce(
    (acc, f) => {
      const c = f.cliente!;
      acc.hemCon += c.hemCon;
      acc.hemTotal += c.hemCon + c.hemSin;
      acc.seleccionUnid += c.seleccionUnid;
      acc.cantidad += c.cantidad;
      acc.podoGrado2 += c.podoGrado2;
      acc.podoMuestra += c.podoMuestra;
      acc.rasgGrado2 += c.rasgGrado2;
      acc.rasgMuestra += c.rasgMuestra;
      acc.pigSuma += c.pigSuma;
      acc.pigUnidades += c.pigUnidades;
      return acc;
    },
    { hemCon: 0, hemTotal: 0, seleccionUnid: 0, cantidad: 0, podoGrado2: 0, podoMuestra: 0, rasgGrado2: 0, rasgMuestra: 0, pigSuma: 0, pigUnidades: 0 }
  );

  const comparativoPct: PuntoComparativo[] = [
    {
      metrica: "% Hematomas",
      granja: aggGranja.hemEval ? Number(pct(aggGranja.hemCon, aggGranja.hemEval).toFixed(2)) : null,
      cliente: aggCliente.hemTotal ? Number(pct(aggCliente.hemCon, aggCliente.hemTotal).toFixed(2)) : null,
    },
    {
      metrica: "% Selección",
      granja: aggGranja.seleccionEval ? Number(pct(aggGranja.seleccionCon, aggGranja.seleccionEval).toFixed(2)) : null,
      cliente: aggCliente.cantidad ? Number(pct(aggCliente.seleccionUnid, aggCliente.cantidad).toFixed(2)) : null,
    },
    {
      metrica: "% Pododermatitis (G2)",
      granja: aggGranja.podoEval ? Number(pct(aggGranja.podoGrado2, aggGranja.podoEval).toFixed(2)) : null,
      cliente: aggCliente.podoMuestra ? Number(pct(aggCliente.podoGrado2, aggCliente.podoMuestra).toFixed(2)) : null,
    },
    {
      metrica: "% Rasguños (G2)",
      granja: aggGranja.rasgEval ? Number(pct(aggGranja.rasgGrado2, aggGranja.rasgEval).toFixed(2)) : null,
      cliente: aggCliente.rasgMuestra ? Number(pct(aggCliente.rasgGrado2, aggCliente.rasgMuestra).toFixed(2)) : null,
    },
  ];
  const pigGranjaAgg = aggGranja.pigEval ? aggGranja.pigSuma / aggGranja.pigEval : null;
  const pigClienteAgg = aggCliente.pigUnidades ? aggCliente.pigSuma / aggCliente.pigUnidades : null;

  const hayFiltros = Boolean(clienteId || plantelId || desde || hasta);

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-slate-900">Engranaje granja ↔ clientes</h1>
      <p className="mb-6 text-sm text-slate-500">
        Compara la calidad evaluada en granja (en la misma pantalla de pesaje, sobre una sub-muestra de aves) contra
        la calidad evaluada en planta del cliente, lote por lote. El cruce usa los valores vigentes de plantel,
        campaña, galpón, corral y categoría/sexo de cada registro -- no la columna de texto ya congelada. La merma
        se analiza por separado, fuera de este comparativo.
      </p>

      {etiquetaMes ? (
        <p className="mb-6 rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-800 ring-1 ring-sky-100">
          Mostrando <strong>{etiquetaMes}</strong> (últimos datos). Usa el filtro de fechas para otro período, o{" "}
          <a href="/dashboard-bi/engranaje?todo=1" className="font-semibold underline hover:no-underline">ver todo el historial</a>.
        </p>
      ) : verTodo ? (
        <p className="mb-6 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">
          Mostrando <strong>todo el historial</strong>.{" "}
          <a href="/dashboard-bi/engranaje" className="font-semibold text-brand underline hover:no-underline">Volver a lo más reciente</a>.
        </p>
      ) : null}

      <form className="mb-6 flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
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
        <button type="submit" className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900">
          Filtrar
        </button>
        {hayFiltros && (
          <a href="/dashboard-bi/engranaje" className="rounded-md px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100">
            Limpiar filtros
          </a>
        )}
      </form>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Lotes cruzados (granja + cliente)" value={lotesCruzados.length.toString()} />
        <KpiCard label="Lotes solo con datos de granja" value={lotesSoloGranja.length.toString()} sub="Pesados/evaluados en granja, sin censo de cliente aún" />
        <KpiCard label="Lotes solo con datos de cliente" value={lotesSoloCliente.length.toString()} sub="Evaluados en planta, sin captura BT en granja" />
        <KpiCard label="Aves con calidad evaluada en granja" value={avesConCalidadGranjaTotal.toString()} sub={`De ${registrosPeso.length} aves pesadas en el periodo`} />
      </div>

      {(inspeccionesSinDatosParaCarear > 0 || registrosPesoSinDatosParaCarear > 0) && (
        <p className="mb-6 text-xs text-amber-600">
          {inspeccionesSinDatosParaCarear > 0 &&
            `${inspeccionesSinDatosParaCarear} inspección(es) sin plantel/galpón/corral/sexo completos -- excluidas del cruce. `}
          {registrosPesoSinDatosParaCarear > 0 &&
            `${registrosPesoSinDatosParaCarear} registro(s) de peso sin datos completos -- excluidos del cruce.`}
        </p>
      )}

      <div className="mb-6 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-3 font-semibold text-slate-900">Comparativo de calidad: granja vs. cliente (lotes cruzados)</h2>
        <ComparativoCalidadChart data={comparativoPct} />
        <p className="mt-3 text-sm text-slate-600">
          Pigmentación promedio (0-7) -- granja: <span className="font-semibold">{pigGranjaAgg != null ? pigGranjaAgg.toFixed(2) : "—"}</span>
          {" · "}cliente: <span className="font-semibold">{pigClienteAgg != null ? pigClienteAgg.toFixed(2) : "—"}</span>
        </p>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-3 font-semibold text-slate-900">Detalle por lote (Plantel-Campaña-Galpón-Categoría-Corral)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Lote</th>
                <th className="px-3 py-2 font-medium">Estado</th>
                <th className="px-3 py-2 font-medium">Aves pesadas</th>
                <th className="px-3 py-2 font-medium">Aves c/calidad (granja)</th>
                <th className="px-3 py-2 font-medium">% Hematomas (G · C)</th>
                <th className="px-3 py-2 font-medium">% Selección (G · C)</th>
                <th className="px-3 py-2 font-medium">% Pododermatitis (G · C)</th>
                <th className="px-3 py-2 font-medium">% Rasguños (G · C)</th>
                <th className="px-3 py-2 font-medium">Pigmentación (G · C)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filas.map((f) => (
                <tr key={f.key} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium text-slate-900">
                    {f.label.plantelCodigo}
                    {f.label.campania ? `-${f.label.campania}` : ""} G{f.label.galpon}-{f.label.corral} ({f.label.categoria})
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                        f.estado === "cruzado"
                          ? "bg-emerald-100 text-emerald-700"
                          : f.estado === "solo-granja"
                            ? "bg-sky-100 text-sky-700"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {f.estado === "cruzado" ? "Cruzado" : f.estado === "solo-granja" ? "Solo granja" : "Solo cliente"}
                    </span>
                  </td>
                  <td className="px-3 py-2">{f.avesPesadas || "—"}</td>
                  <td className="px-3 py-2">{f.avesConCalidadGranja || "—"}</td>
                  <td className="px-3 py-2">
                    <MetricaCelda granja={f.pctHematomasGranja} cliente={f.pctHematomasCliente} clienteSemaforo={f.pctHematomasCliente != null ? semaforo(f.pctHematomasCliente, UMBRAL_HEMATOMAS) : null} />
                  </td>
                  <td className="px-3 py-2">
                    <MetricaCelda granja={f.pctSeleccionGranja} cliente={f.pctSeleccionCliente} clienteSemaforo={f.pctSeleccionCliente != null ? semaforoMax(f.pctSeleccionCliente, OBJETIVO_SELECCION) : null} />
                  </td>
                  <td className="px-3 py-2">
                    <MetricaCelda granja={f.pctPodoGranja} cliente={f.pctPodoCliente} clienteSemaforo={f.pctPodoCliente != null ? semaforoMax(f.pctPodoCliente, OBJETIVO_PODODERMATITIS) : null} />
                  </td>
                  <td className="px-3 py-2">
                    <MetricaCelda granja={f.pctRasgGranja} cliente={f.pctRasgCliente} clienteSemaforo={f.pctRasgCliente != null ? semaforoMax(f.pctRasgCliente, OBJETIVO_RASGUNOS) : null} />
                  </td>
                  <td className="px-3 py-2">
                    <MetricaCelda granja={f.pigGranja} cliente={f.pigCliente} suffix="" />
                  </td>
                </tr>
              ))}
              {filas.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-6 text-center text-slate-400">
                    Aún no hay lotes con datos de granja ni de cliente registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function MetricaCelda({
  granja,
  cliente,
  clienteSemaforo,
  suffix = "%",
}: {
  granja: number | null;
  cliente: number | null;
  clienteSemaforo?: "verde" | "amarillo" | "rojo" | null;
  suffix?: string;
}) {
  return (
    <span className="whitespace-nowrap">
      <span className="text-slate-500">G: </span>
      {granja != null ? `${granja.toFixed(2)}${suffix}` : "—"}
      <span className="mx-1 text-slate-300">·</span>
      <span className="text-slate-500">C: </span>
      {cliente != null ? (
        clienteSemaforo ? (
          <span className={`rounded-md px-1.5 py-0.5 font-semibold ${SEMAFORO_BADGE[clienteSemaforo]}`}>
            {cliente.toFixed(2)}
            {suffix}
          </span>
        ) : (
          `${cliente.toFixed(2)}${suffix}`
        )
      ) : (
        "—"
      )}
    </span>
  );
}
