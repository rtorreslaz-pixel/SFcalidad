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
    },
  });

  const headers = [
    "AÑO", "MES", "SEMANA", "ZONAS", "TIPO DE PLANTEL", "ZONA DE EVALUACION",
    "CAMPAÑA", "N° GUIA", "FECHA", "CLIENTE", "PLANTEL", "GALPON", "SEXO",
    "DENSIDAD", "PESO PROM VIVO",
    "T° VEHÍCULO", "T° PLATAFORMA VACÍA", "T° PLATAFORMA LLENA",
    "DIF DE T° EN RAMPA", "Min", "Max",
  ];

  const dataRows = inspecciones.map((insp) => {
    const fecha = insp.fecha ?? insp.jornada?.fecha ?? null;
    const clienteNombre = insp.cliente?.nombre ?? insp.jornada?.cliente?.nombre ?? "";

    const t1 = insp.tempCamion;
    const t2 = insp.tempPlataformaVacia;
    const t3 = insp.tempPlataforma;

    const temps = [t1, t2, t3].filter((t): t is number => t != null);
    const dif = t3 != null && t2 != null ? t3 - t2 : "";
    const min = temps.length > 0 ? Math.min(...temps) : "";
    const max = temps.length > 0 ? Math.max(...temps) : "";

    return {
      fecha,
      row: [
        insp.anio ?? insp.jornada?.anio ?? "",
        insp.mes ?? insp.jornada?.mes ?? "",
        insp.semana ?? insp.jornada?.semana ?? "",
        insp.plantel?.zona ?? "",
        insp.plantel?.tipoPlantel ?? "",
        insp.plantel?.zonaEvaluacion ?? "",
        insp.campania ?? "",
        insp.nroGuia ?? "",
        fecha ? fecha.toISOString().slice(0, 10) : "",
        clienteNombre,
        insp.plantel?.codigo ?? "",
        insp.galpon ?? "",
        insp.sexo ?? "",
        insp.densidad ?? "",
        insp.promVivo ?? "",
        t1 ?? "", t2 ?? "", t3 ?? "",
        dif, min, max,
      ],
    };
  });

  dataRows.sort((a, b) => (b.fecha?.getTime() ?? 0) - (a.fecha?.getTime() ?? 0));

  const rows: (string | number)[][] = [headers, ...dataRows.map((d) => d.row)];
  return csvResponse(rows, "temperaturas");
}
