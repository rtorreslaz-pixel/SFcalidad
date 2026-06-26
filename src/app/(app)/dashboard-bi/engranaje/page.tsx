import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { CategoriaAve } from "@/generated/prisma/enums";
import { buildComplexEntity } from "@/lib/complex-entity";
import { esDefectoMerma } from "@/lib/defectos-merma";
import { EngranajeScatterChart, type PuntoEngranaje } from "./charts";

const UMBRAL_MERMA = { verde: 2, amarillo: 5 };

function pct(num: number, den: number): number {
  return den ? (num / den) * 100 : 0;
}

function semaforo(value: number, umbral: { verde: number; amarillo: number }): "verde" | "amarillo" | "rojo" {
  if (value <= umbral.verde) return "verde";
  if (value <= umbral.amarillo) return "amarillo";
  return "rojo";
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

type CalidadAgg = LoteLabel & {
  evaluaciones: number;
  cantidad: number;
  seleccionUnid: number;
  mermaUnid: number;
  hemCon: number;
  hemSin: number;
};

type PesoAgg = LoteLabel & {
  avesPesadas: number;
  sumaPesoGramos: number;
};

function pearson(xs: number[], ys: number[]): number | null {
  const n = xs.length;
  if (n < 2) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  if (denX === 0 || denY === 0) return null;
  return num / Math.sqrt(denX * denY);
}

export default async function EngranajePage({
  searchParams,
}: {
  searchParams: Promise<{ clienteId?: string; plantelId?: string; desde?: string; hasta?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "VERIFICADOR") redirect("/jornadas");
  if (user.role === "COMERCIAL") redirect("/dashboard/preventa");

  const { clienteId, plantelId, desde, hasta } = await searchParams;

  const whereInspeccion: Prisma.InspeccionWhereInput = {
    ...(clienteId ? { clienteId } : {}),
    ...(plantelId ? { plantelId } : {}),
  };
  const wherePeso: Prisma.RegistroPesoPreventaWhereInput = {
    ...(clienteId ? { plantel: { clienteId } } : {}),
    ...(plantelId ? { plantelId } : {}),
  };

  const [inspeccionesSinFecha, registrosPesoSinFecha, clientes, planteles] = await Promise.all([
    prisma.inspeccion.findMany({
      where: whereInspeccion,
      include: {
        plantel: { select: { codigo: true } },
        defectos: { include: { tipoDefecto: true } },
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

  const calidadMap = new Map<string, CalidadAgg>();
  function calidadEntry(key: string, label: LoteLabel): CalidadAgg {
    let entry = calidadMap.get(key);
    if (!entry) {
      entry = { ...label, evaluaciones: 0, cantidad: 0, seleccionUnid: 0, mermaUnid: 0, hemCon: 0, hemSin: 0 };
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
    // Igual que en dashboard-bi: las evaluaciones "solo lesión/pigmentación" no traen censo
    // de selección/merma, así que no se suman a esos contadores (sí a hematomas y evaluaciones).
    if (!insp.soloLesionPigmentacion) {
      entry.cantidad += insp.cantidad;
      for (const d of insp.defectos) {
        if (esDefectoMerma(d.tipoDefecto.nombre)) entry.mermaUnid += d.unidades;
        else entry.seleccionUnid += d.unidades;
      }
    }
  }

  const pesoMap = new Map<string, PesoAgg>();
  function pesoEntry(key: string, label: LoteLabel): PesoAgg {
    let entry = pesoMap.get(key);
    if (!entry) {
      entry = { ...label, avesPesadas: 0, sumaPesoGramos: 0 };
      pesoMap.set(key, entry);
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
    const entry = pesoEntry(matched.key, matched.label);
    entry.avesPesadas += 1;
    entry.sumaPesoGramos += r.pesoGramos;
  }

  type FilaEngranaje = {
    key: string;
    label: LoteLabel;
    pesoPromedioGramos: number | null;
    avesPesadas: number;
    evaluacionesCalidad: number;
    pctSeleccion: number | null;
    pctMerma: number | null;
    pctHematomas: number | null;
    estado: "cruzado" | "solo-peso" | "solo-calidad";
  };
  const todasLasClaves = new Set<string>([...calidadMap.keys(), ...pesoMap.keys()]);
  const filas: FilaEngranaje[] = Array.from(todasLasClaves).map((key) => {
    const calidad = calidadMap.get(key) ?? null;
    const peso = pesoMap.get(key) ?? null;
    const label = calidad ?? (peso as LoteLabel);
    return {
      key,
      label,
      pesoPromedioGramos: peso ? peso.sumaPesoGramos / peso.avesPesadas : null,
      avesPesadas: peso?.avesPesadas ?? 0,
      evaluacionesCalidad: calidad?.evaluaciones ?? 0,
      pctSeleccion: calidad ? pct(calidad.seleccionUnid, calidad.cantidad) : null,
      pctMerma: calidad ? pct(calidad.mermaUnid, calidad.cantidad) : null,
      pctHematomas: calidad ? pct(calidad.hemCon, calidad.hemCon + calidad.hemSin) : null,
      estado: calidad && peso ? "cruzado" : peso ? "solo-peso" : "solo-calidad",
    };
  });

  const estadoOrden: Record<FilaEngranaje["estado"], number> = { cruzado: 0, "solo-peso": 1, "solo-calidad": 2 };
  filas.sort((a, b) => {
    if (estadoOrden[a.estado] !== estadoOrden[b.estado]) return estadoOrden[a.estado] - estadoOrden[b.estado];
    if (a.estado === "cruzado") return (a.pctMerma ?? 0) - (b.pctMerma ?? 0);
    return a.key.localeCompare(b.key);
  });

  const lotesCruzados = filas.filter((f) => f.estado === "cruzado");
  const lotesSoloPeso = filas.filter((f) => f.estado === "solo-peso");
  const lotesSoloCalidad = filas.filter((f) => f.estado === "solo-calidad");

  const scatterData: PuntoEngranaje[] = lotesCruzados.map((f) => ({
    pesoPromedioGramos: Number((f.pesoPromedioGramos as number).toFixed(1)),
    pctMerma: Number((f.pctMerma as number).toFixed(3)),
    categoria: f.label.categoria,
    etiqueta: `${f.label.plantelCodigo} G${f.label.galpon}-${f.label.corral} (${f.label.categoria})`,
  }));

  const correlacionPesoMerma = pearson(
    lotesCruzados.map((f) => f.pesoPromedioGramos as number),
    lotesCruzados.map((f) => f.pctMerma as number)
  );

  const hayFiltros = Boolean(clienteId || plantelId || desde || hasta);

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-slate-900">Engranaje granja ↔ clientes</h1>
      <p className="mb-6 text-sm text-slate-500">
        Cruza el peso capturado en granja (Preventa) contra la calidad evaluada en planta del cliente, lote por
        lote. El cruce usa los valores vigentes de plantel, campaña, galpón, corral y categoría/sexo de cada
        registro -- no la columna de texto ya congelada.
      </p>

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
        <KpiCard label="Lotes cruzados (peso + calidad)" value={lotesCruzados.length.toString()} />
        <KpiCard label="Lotes solo con peso" value={lotesSoloPeso.length.toString()} sub="Pesados en granja, sin evaluación de calidad aún" />
        <KpiCard label="Lotes solo con calidad" value={lotesSoloCalidad.length.toString()} sub="Evaluados en planta, sin captura de peso BT" />
        <KpiCard
          label="Correlación peso ↔ % merma"
          value={correlacionPesoMerma != null ? correlacionPesoMerma.toFixed(2) : "Sin datos suficientes"}
          sub="Pearson sobre lotes cruzados, -1 a 1"
        />
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
        <h2 className="mb-3 font-semibold text-slate-900">Peso promedio en granja vs. % merma en cliente, por lote</h2>
        <EngranajeScatterChart data={scatterData} />
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
                <th className="px-3 py-2 font-medium">Peso promedio</th>
                <th className="px-3 py-2 font-medium">Evaluaciones calidad</th>
                <th className="px-3 py-2 font-medium">% Selección</th>
                <th className="px-3 py-2 font-medium">% Merma</th>
                <th className="px-3 py-2 font-medium">% Hematomas</th>
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
                          : f.estado === "solo-peso"
                            ? "bg-sky-100 text-sky-700"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {f.estado === "cruzado" ? "Cruzado" : f.estado === "solo-peso" ? "Solo peso" : "Solo calidad"}
                    </span>
                  </td>
                  <td className="px-3 py-2">{f.avesPesadas || "—"}</td>
                  <td className="px-3 py-2">{f.pesoPromedioGramos != null ? `${f.pesoPromedioGramos.toFixed(0)} g` : "—"}</td>
                  <td className="px-3 py-2">{f.evaluacionesCalidad || "—"}</td>
                  <td className="px-3 py-2">{f.pctSeleccion != null ? `${f.pctSeleccion.toFixed(2)}%` : "—"}</td>
                  <td className="px-3 py-2">
                    {f.pctMerma != null ? (
                      <span className={`rounded-md px-2 py-0.5 font-semibold ${SEMAFORO_BADGE[semaforo(f.pctMerma, UMBRAL_MERMA)]}`}>
                        {f.pctMerma.toFixed(2)}%
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2">{f.pctHematomas != null ? `${f.pctHematomas.toFixed(2)}%` : "—"}</td>
                </tr>
              ))}
              {filas.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-slate-400">
                    Aún no hay lotes con peso ni calidad registrados.
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
