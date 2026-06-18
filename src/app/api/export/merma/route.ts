import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { resolveExportUser, buildInspeccionWhere, csvResponse } from "@/lib/export-csv";

const NOMBRES_MERMA_PASO7 = [
  "Alas Grado 1°", "Alas Grado 2°", "Alas Grado 3°", "Alas Rota",
  "Pierna Grado 1°", "Pierna Grado 2°", "Pierna Grado 3°", "Pierna Rota",
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const user = await resolveExportUser(request);
  const where = buildInspeccionWhere(searchParams, user);

  const inspecciones = await prisma.inspeccion.findMany({
    where,
    orderBy: { fecha: "desc" },
    include: {
      cliente: true,
      plantel: true,
      verificador: { select: { nombre: true } },
      defectos: { include: { tipoDefecto: true } },
      jornada: { include: { cliente: true, verificador: { select: { nombre: true } } } },
    },
  });

  const tiposMerma = (await prisma.tipoDefecto.findMany({ orderBy: { orden: "asc" } })).filter((t) =>
    NOMBRES_MERMA_PASO7.includes(t.nombre)
  );

  const baseHeaders = [
    "ID",
    "AÑO",
    "MES",
    "SEMANA",
    "FECHA",
    "CLIENTE",
    "PLANTEL",
    "GALPON",
    "TIPO DE PLANTEL",
    "ZONA",
    "SUBZONA",
    "ZONA DE EVALUACION",
    "CAMPAÑA",
    "NRO GUIA",
    "SEXO",
    "VERIFICADOR",
  ];

  const mermaHeaders = tiposMerma.flatMap((t) => [t.nombre.toUpperCase(), `KG ${t.nombre.toUpperCase()}`]);

  const dataRows = inspecciones.map((insp) => {
    const fecha = insp.fecha ?? insp.jornada?.fecha ?? null;
    const anio = insp.anio ?? insp.jornada?.anio ?? null;
    const mes = insp.mes ?? insp.jornada?.mes ?? null;
    const semana = insp.semana ?? insp.jornada?.semana ?? null;
    const clienteNombre = insp.cliente?.nombre ?? insp.jornada?.cliente?.nombre ?? "";
    const verificadorNombre = insp.verificador?.nombre ?? insp.jornada?.verificador?.nombre ?? "";

    const defectoMap = new Map(insp.defectos.map((d) => [d.tipoDefectoId, d]));

    const baseRow = [
      insp.id,
      anio ?? "",
      mes ?? "",
      semana ?? "",
      fecha ? fecha.toISOString().slice(0, 10) : "",
      clienteNombre,
      insp.plantel?.codigo ?? "",
      insp.galpon ?? "",
      insp.plantel?.tipoPlantel ?? "",
      insp.plantel?.zona ?? "",
      insp.plantel?.subZona ?? "",
      insp.plantel?.zonaEvaluacion ?? "",
      insp.campania ?? "",
      insp.nroGuia ?? "",
      insp.sexo ?? "",
      verificadorNombre,
    ];

    const mermaRow = tiposMerma.flatMap((t) => {
      const d = defectoMap.get(t.id);
      return [d?.unidades ?? 0, d ? d.kg.toFixed(2) : "0"];
    });

    return { fecha, row: [...baseRow, ...mermaRow] };
  });

  dataRows.sort((a, b) => (b.fecha?.getTime() ?? 0) - (a.fecha?.getTime() ?? 0));

  const rows: (string | number)[][] = [[...baseHeaders, ...mermaHeaders], ...dataRows.map((d) => d.row)];

  return csvResponse(rows, "merma");
}
