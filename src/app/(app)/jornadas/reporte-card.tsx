import { Fragment } from "react";
import { Prisma } from "@/generated/prisma/client";

export const JORNADA_REPORTE_INCLUDE = {
  cliente: true,
  verificador: { select: { nombre: true } },
  inspecciones: {
    where: { estado: "COMPLETA" },
    orderBy: { createdAt: "asc" },
    include: {
      plantel: { select: { codigo: true } },
      defectos: { include: { tipoDefecto: true }, orderBy: { tipoDefecto: { orden: "asc" } } },
      evaluacionesLesion: true,
    },
  },
} satisfies Prisma.JornadaInclude;

export type JornadaReporte = Prisma.JornadaGetPayload<{ include: typeof JORNADA_REPORTE_INCLUDE }>;

const NOMBRES_MERMA_PASO7 = [
  "Alas Grado 1°", "Alas Grado 2°", "Alas Grado 3°", "Alas Rota",
  "Pierna Grado 1°", "Pierna Grado 2°", "Pierna Grado 3°", "Pierna Rota",
  "Alas Mutiladas", "Piernas Mutiladas",
];

const UMBRAL_MERMA = { verde: 2, amarillo: 5 };
const OBJETIVO_PIGMENTACION = { min: 3.0, max: 3.5 };
const OBJETIVO_PODODERMATITIS = 11;
const OBJETIVO_RASGUNOS = 10;

const SEMAFORO_BADGE = {
  verde: "bg-emerald-100 text-emerald-700",
  amarillo: "bg-amber-100 text-amber-700",
  rojo: "bg-red-100 text-red-700",
};

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

function semaforoRango(value: number, min: number, max: number): "verde" | "rojo" {
  return value >= min && value <= max ? "verde" : "rojo";
}

function Badge({ value, tono }: { value: string; tono: "verde" | "amarillo" | "rojo" }) {
  return <span className={`inline-block rounded-md px-2 py-0.5 text-sm font-semibold ${SEMAFORO_BADGE[tono]}`}>{value}</span>;
}

function sexoAbrev(sexo: "MACHO" | "HEMBRA" | null) {
  return sexo === "MACHO" ? "M" : sexo === "HEMBRA" ? "H" : "-";
}

function ubicacion(insp: { plantel: { codigo: string } | null; galpon: string | null; corral: string | null }) {
  return { pl: insp.plantel?.codigo ?? "-", gl: [insp.galpon, insp.corral].filter(Boolean).join("-") || "-" };
}

export default function ReporteCard({ jornada }: { jornada: JornadaReporte }) {
  const fechaLabel = jornada.fecha.toLocaleDateString("es-PE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  // Selección/merma: una fila por evaluación que trae censo (excluye registros solo de lesión/pigmentación).
  const seleccionRows = jornada.inspecciones
    .filter((insp) => !insp.soloLesionPigmentacion)
    .map((insp) => {
      const { pl, gl } = ubicacion(insp);
      let seleccionUnid = 0;
      let mermaUnid = 0;
      const breakdown: { nombre: string; unidades: number }[] = [];
      for (const d of insp.defectos) {
        if (d.unidades <= 0) continue;
        if (NOMBRES_MERMA_PASO7.includes(d.tipoDefecto.nombre)) {
          mermaUnid += d.unidades;
        } else {
          seleccionUnid += d.unidades;
          breakdown.push({ nombre: d.tipoDefecto.nombre, unidades: d.unidades });
        }
      }
      return {
        id: insp.id, pl, gl, sexo: insp.sexo, cantidad: insp.cantidad,
        seleccionUnid, mermaUnid, breakdown,
        pctSeleccion: pct(seleccionUnid, insp.cantidad),
        pctMerma: pct(mermaUnid, insp.cantidad),
        objetivo: insp.metaPorcentaje,
      };
    });

  // Pigmentación: una fila por evaluación con muestra registrada.
  const pigmentacionRows = jornada.inspecciones
    .map((insp) => {
      const { pl, gl } = ubicacion(insp);
      const niveles = [
        insp.pigNivel0, insp.pigNivel1, insp.pigNivel2, insp.pigNivel3,
        insp.pigNivel4, insp.pigNivel5, insp.pigNivel6, insp.pigNivel7,
      ];
      const unidades = niveles.reduce((a, b) => a + b, 0);
      if (!unidades) return null;
      const suma = niveles.reduce((acc, cant, nivel) => acc + cant * nivel, 0);
      return { id: insp.id, pl, gl, sexo: insp.sexo, promedio: suma / unidades };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  // Pododermatitis y rasguños: una fila por cada muestra de lesión registrada (cada una trae su propio sexo).
  const lesionRows = jornada.inspecciones.flatMap((insp) => {
    const { pl, gl } = ubicacion(insp);
    return insp.evaluacionesLesion.map((ev) => ({
      id: ev.id, pl, gl, sexo: ev.sexo,
      medicion: ev.categoria === "ALMOHADILLAS" ? "Pododermatitis" : "Rasguños",
      objetivo: ev.categoria === "ALMOHADILLAS" ? OBJETIVO_PODODERMATITIS : OBJETIVO_RASGUNOS,
      pctGrado0: pct(ev.sinLesion, ev.muestra),
      pctGrado1: pct(ev.leve, ev.muestra),
      pctGrado2: pct(ev.grave, ev.muestra),
    }));
  });

  const sinDatos = seleccionRows.length === 0 && pigmentacionRows.length === 0 && lesionRows.length === 0;

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 print:shadow-none print:ring-0">
      <div className="bg-slate-900 px-5 py-4 text-white">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
          🐔 Control de Calidad · Reporte diario
        </p>
        <h1 className="mt-1 text-lg font-bold">{jornada.cliente.nombre}</h1>
        <p className="text-sm capitalize text-slate-300">{fechaLabel}</p>
      </div>

      <div className="space-y-6 p-5">
        {sinDatos && (
          <p className="py-8 text-center text-sm text-slate-400">
            Aún no hay evaluaciones completas en esta jornada para generar el reporte.
          </p>
        )}

        {seleccionRows.length > 0 && (
          <section>
            <h2 className="mb-2 font-semibold text-slate-900">Selección</h2>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">Pl</th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">Gl</th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">Sexo</th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">Beneficiado</th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">Selección</th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">% Selección</th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">Objetivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {seleccionRows.map((r) => (
                    <Fragment key={r.id}>
                      <tr>
                        <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-900">{r.pl}</td>
                        <td className="whitespace-nowrap px-3 py-2">{r.gl}</td>
                        <td className="whitespace-nowrap px-3 py-2">{sexoAbrev(r.sexo)}</td>
                        <td className="whitespace-nowrap px-3 py-2">{r.cantidad.toLocaleString("es-PE")}</td>
                        <td className="whitespace-nowrap px-3 py-2">{r.seleccionUnid}</td>
                        <td className="whitespace-nowrap px-3 py-2">
                          <Badge value={`${r.pctSeleccion.toFixed(2)}%`} tono={semaforoMax(r.pctSeleccion, r.objetivo)} />
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-500">≤ {r.objetivo.toFixed(2)}%</td>
                      </tr>
                      {(r.breakdown.length > 0 || r.mermaUnid > 0) && (
                        <tr className="bg-sky-50/60">
                          <td colSpan={7} className="px-3 py-2">
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                              {r.breakdown.map((b) => (
                                <span key={b.nombre}>
                                  {b.nombre} <strong>{b.unidades}</strong> ({pct(b.unidades, r.cantidad).toFixed(2)}%)
                                </span>
                              ))}
                            </div>
                            {r.mermaUnid > 0 && (
                              <div className="mt-1 flex items-center gap-2">
                                <Badge value={`Merma ${r.pctMerma.toFixed(2)}%`} tono={semaforo(r.pctMerma, UMBRAL_MERMA)} />
                                <span className="text-xs text-slate-400">objetivo ≤ {UMBRAL_MERMA.verde}%</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {pigmentacionRows.length > 0 && (
          <section>
            <h2 className="mb-2 font-semibold text-slate-900">Pigmentación</h2>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[420px] text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">Pl</th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">Gl</th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">Sexo</th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">Pigmentación</th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">Objetivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pigmentacionRows.map((r) => (
                    <tr key={r.id}>
                      <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-900">{r.pl}</td>
                      <td className="whitespace-nowrap px-3 py-2">{r.gl}</td>
                      <td className="whitespace-nowrap px-3 py-2">{sexoAbrev(r.sexo)}</td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <Badge
                          value={r.promedio.toFixed(2)}
                          tono={semaforoRango(r.promedio, OBJETIVO_PIGMENTACION.min, OBJETIVO_PIGMENTACION.max)}
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-500">
                        {OBJETIVO_PIGMENTACION.min} - {OBJETIVO_PIGMENTACION.max}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {lesionRows.length > 0 && (
          <section>
            <h2 className="mb-2 font-semibold text-slate-900">Pododermatitis y rasguños</h2>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">Pl</th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">Gl</th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">Sexo</th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">Medición</th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">Grado 0</th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">Grado 1</th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">Grado 2</th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">Objetivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lesionRows.map((r) => (
                    <tr key={r.id}>
                      <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-900">{r.pl}</td>
                      <td className="whitespace-nowrap px-3 py-2">{r.gl}</td>
                      <td className="whitespace-nowrap px-3 py-2">{sexoAbrev(r.sexo)}</td>
                      <td className="whitespace-nowrap px-3 py-2">{r.medicion}</td>
                      <td className="whitespace-nowrap px-3 py-2">{r.pctGrado0.toFixed(0)}%</td>
                      <td className="whitespace-nowrap px-3 py-2">{r.pctGrado1.toFixed(0)}%</td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <Badge value={`${r.pctGrado2.toFixed(0)}%`} tono={semaforoMax(r.pctGrado2, r.objetivo)} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-500">≤ {r.objetivo}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <p className="pt-2 text-right text-xs text-slate-400">
          Generado el {new Date().toLocaleString("es-PE")} · {jornada.verificador.nombre}
        </p>
      </div>
    </div>
  );
}
