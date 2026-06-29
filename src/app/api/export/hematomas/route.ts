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
      hematomaDetalles: true,
    },
  });

  const headers = [
    "AÑO", "MES", "SEMANA", "TIPO DE PLANTEL", "SUBZONA", "ZONA DE EVALUACION",
    "CAMPAÑA", "NRO GUIA", "FECHA", "CLIENTE", "PLANTEL", "GALPÓN", "SEXO",
    "1ER GRADO", "2DO GRADO", "3ER GRADO", "TOTAL", "EVALUADOS",
    "% GRADO 1", "% GRADO 2", "% GRADO 3", "%TOTAL", "%SIN HEMATOMAS",
  ];

  const dataRows = inspecciones.map((insp) => {
    const fecha = insp.fecha ?? insp.jornada?.fecha ?? null;
    const clienteNombre = insp.cliente?.nombre ?? insp.jornada?.cliente?.nombre ?? "";

    const g1 = insp.hematomaDetalles.filter((d) => d.grado === "GRADO1").reduce((s, d) => s + d.cantidad, 0);
    const g2 = insp.hematomaDetalles.filter((d) => d.grado === "GRADO2").reduce((s, d) => s + d.cantidad, 0);
    const g3 = insp.hematomaDetalles.filter((d) => d.grado === "GRADO3").reduce((s, d) => s + d.cantidad, 0);
    const total = g1 + g2 + g3;
    const evaluados = (insp.hematomasCon ?? 0) + (insp.hematomasSin ?? 0);
    const pct = (v: number) => evaluados > 0 ? (v / evaluados) : 0;

    return {
      fecha,
      row: [
        insp.anio ?? insp.jornada?.anio ?? "",
        insp.mes ?? insp.jornada?.mes ?? "",
        insp.semana ?? insp.jornada?.semana ?? "",
        insp.plantel?.tipoPlantel ?? "",
        insp.plantel?.subZona ?? "",
        insp.plantel?.zonaEvaluacion ?? "",
        insp.campania ?? "",
        insp.nroGuia ?? "",
        fecha ? fecha.toISOString().slice(0, 10) : "",
        clienteNombre,
        insp.plantel?.codigo ?? "",
        insp.galpon ?? "",
        insp.sexo ?? "",
        g1, g2, g3, total, evaluados,
        pct(g1), pct(g2), pct(g3), pct(total), pct(insp.hematomasSin ?? 0),
      ],
    };
  });

  dataRows.sort((a, b) => (b.fecha?.getTime() ?? 0) - (a.fecha?.getTime() ?? 0));

  const rows: (string | number)[][] = [headers, ...dataRows.map((d) => d.row)];
  return csvResponse(rows, "hematomas");
}
