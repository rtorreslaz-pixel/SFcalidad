import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { resolveExportUser, buildInspeccionWhere, csvEscape } from "@/lib/export-csv";
import { NextResponse } from "next/server";

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
    },
  });

  const headers = [
    "Fecha de Registro", "Complex Entity", "Cliente", "Zona de Evaluación",
    "Pig-0", "Pig-1", "Pig-2", "Pig-3", "Pig-4", "Pig-5", "Pig-6",
    "TOTAL", "__PowerAppsId__", "plantel", "CAMPAÑA", "Galpón",
    "sex", "SEXO", "CORRAL", "SUBZONA", "TIPO DE PLANTEL", "SEMANA",
    "% GRADO 0", "% GRADO 1", "% GRADO 2", "% GRADO 3",
    "% GRADO 4", "% GRADO 5", "% GRADO 6",
    "PONDERADO", "GALPÓN-CORRAL",
  ];

  const SEXO_ABREV: Record<string, string> = { MACHO: "M", HEMBRA: "H" };

  const dataRows = inspecciones.map((insp) => {
    const fecha = insp.fecha ?? insp.jornada?.fecha ?? null;
    const clienteNombre = insp.cliente?.nombre ?? insp.jornada?.cliente?.nombre ?? "";
    const pig = [
      insp.pigNivel0, insp.pigNivel1, insp.pigNivel2, insp.pigNivel3,
      insp.pigNivel4, insp.pigNivel5, insp.pigNivel6,
    ];
    const total = pig.reduce((s, v) => s + v, 0);
    const pct = (v: number) => total > 0 ? `${((v / total) * 100).toFixed(1)}%` : "0%";
    const ponderado = total > 0
      ? pig.reduce((s, v, i) => s + v * i, 0) / total
      : 0;

    return {
      fecha,
      row: [
        fecha ? fecha.toISOString().slice(0, 10) : "",
        insp.complex ?? "",
        clienteNombre,
        insp.plantel?.zonaEvaluacion ?? "",
        ...pig,
        total,
        insp.id,
        insp.plantel?.codigo ?? "",
        insp.campania ?? "",
        insp.galpon ?? "",
        insp.sexo ? SEXO_ABREV[insp.sexo] ?? "" : "",
        insp.sexo ?? "",
        insp.corral ?? "",
        insp.plantel?.subZona ?? "",
        insp.plantel?.tipoPlantel ?? "",
        insp.semana ?? insp.jornada?.semana ?? "",
        pct(pig[0]), pct(pig[1]), pct(pig[2]), pct(pig[3]),
        pct(pig[4]), pct(pig[5]), pct(pig[6]),
        ponderado.toFixed(2),
        `${insp.galpon ?? ""}${insp.corral ?? ""}`,
      ],
    };
  });

  dataRows.sort((a, b) => (b.fecha?.getTime() ?? 0) - (a.fecha?.getTime() ?? 0));

  // Pigmentación uses comma separator (matching the analyst's file)
  const csv = [headers, ...dataRows.map((d) => d.row)]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");
  const bom = "﻿";

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pigmentacion_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
