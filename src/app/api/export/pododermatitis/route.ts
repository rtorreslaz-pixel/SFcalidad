import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { resolveExportUser, buildInspeccionWhere, csvResponse } from "@/lib/export-csv";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const user = await resolveExportUser(request);
  const where = buildInspeccionWhere(searchParams, user);

  const inspecciones = await prisma.inspeccion.findMany({
    where,
    orderBy: { fecha: "desc" },
    include: {
      plantel: true,
      jornada: { include: { cliente: true } },
      cliente: true,
      evaluacionesLesion: true,
    },
  });

  const headers = [
    "AÑO", "MES", "SEMANA", "TIPO DE PLANTEL", "SUBZONA", "ZONA DE EVALUACION",
    "CAMPAÑA", "NRO GUIA", "TIPO DE EVALUACIÓN", "FECHA", "CLIENTE", "PLANTEL",
    "GALPÓN", "SEXO", "GRADO 0", "GRADO 1", "GRADO 2", "N° EVALUADOS",
    "% GRADO 0", "% GRADO 1", "% GRADO 2",
  ];

  const dataRows: { fecha: Date | null; row: (string | number)[] }[] = [];

  for (const insp of inspecciones) {
    const fecha = insp.fecha ?? insp.jornada?.fecha ?? null;
    const anio = insp.anio ?? insp.jornada?.anio ?? "";
    const mes = insp.mes ?? insp.jornada?.mes ?? "";
    const semana = insp.semana ?? insp.jornada?.semana ?? "";
    const clienteNombre = insp.cliente?.nombre ?? insp.jornada?.cliente?.nombre ?? "";

    const base = [
      anio, mes, semana,
      insp.plantel?.tipoPlantel ?? "",
      insp.plantel?.subZona ?? "",
      insp.plantel?.zonaEvaluacion ?? "",
      insp.campania ?? "",
      insp.nroGuia ?? "",
    ];

    const infoRow = [
      fecha ? fecha.toISOString().slice(0, 10) : "",
      clienteNombre,
      insp.plantel?.codigo ?? "",
      insp.galpon ?? "",
      insp.sexo ?? "",
    ];

    for (const [tipo, label] of [["ALMOHADILLAS", "PODODERMATITIS"], ["RASGUNOS", "RASGUÑOS"]] as const) {
      const ev = insp.evaluacionesLesion.find((e) => e.categoria === tipo);
      const g0 = ev?.sinLesion ?? 0;
      const g1 = ev?.leve ?? 0;
      const g2 = ev?.grave ?? 0;
      const total = g0 + g1 + g2;
      const pct = (v: number) => total > 0 ? (v / total) : 0;

      dataRows.push({
        fecha,
        row: [
          ...base, label,
          ...infoRow,
          g0, g1, g2, total,
          pct(g0), pct(g1), pct(g2),
        ],
      });
    }
  }

  dataRows.sort((a, b) => (b.fecha?.getTime() ?? 0) - (a.fecha?.getTime() ?? 0));

  const rows: (string | number)[][] = [headers, ...dataRows.map((d) => d.row)];
  return csvResponse(rows, "pododermatitis");
}
