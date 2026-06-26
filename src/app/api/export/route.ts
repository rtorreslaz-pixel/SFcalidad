import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { calcularPorcentajeSeleccion } from "@/lib/calc";
import { resolveExportUser, buildInspeccionWhere, csvResponse } from "@/lib/export-csv";

const NOMBRES_MERMA_PASO7 = [
  "Alas Grado 1°", "Alas Grado 2°", "Alas Grado 3°", "Alas Rota",
  "Pierna Grado 1°", "Pierna Grado 2°", "Pierna Grado 3°", "Pierna Rota",
  "Alas Mutiladas", "Piernas Mutiladas",
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
      hematomaDetalles: true,
      evaluacionesLesion: true,
    },
  });

  const tiposDefecto = (await prisma.tipoDefecto.findMany({ orderBy: { orden: "asc" } })).filter(
    (t) => !NOMBRES_MERMA_PASO7.includes(t.nombre)
  );

  const HEMATOMA_GRADOS = [
    { key: "GRADO1", label: "1er grado" },
    { key: "GRADO2", label: "2do grado" },
    { key: "GRADO3", label: "3er grado" },
  ] as const;

  const HEMATOMA_UBICACIONES = [
    { key: "ALA", label: "Ala" },
    { key: "ESPINAZO", label: "Espinazo" },
    { key: "PECHUGA", label: "Pechuga" },
    { key: "PIERNA", label: "Pierna" },
  ] as const;

  const LESION_CATEGORIAS = ["ALMOHADILLAS", "RASGUNOS"] as const;

  const hematomaHeaders = HEMATOMA_GRADOS.flatMap((g) =>
    HEMATOMA_UBICACIONES.map((u) => `HEMATOMAS ${g.label.toUpperCase()} ${u.label.toUpperCase()}`)
  );

  const lesionHeaders = LESION_CATEGORIAS.flatMap((cat) => [`${cat} SIN LESION`, `${cat} LEVE`, `${cat} GRAVE`]);

  const pigmentacionHeaders = Array.from({ length: 8 }, (_, i) => `PIGMENTACION NIVEL ${i}`);

  const baseHeaders = [
    "ID",
    "AÑO",
    "MES",
    "SEMANA",
    "FECHA",
    "CLIENTE",
    "PLANTEL",
    "GALPON",
    "CORRAL",
    "TIPO DE PLANTEL",
    "ZONA",
    "SUBZONA",
    "ZONA DE EVALUACION",
    "CAMPAÑA",
    "NRO GUIA",
    "SEXO",
    "JABAS",
    "CANTIDAD",
    "PROMEDIO VIVO",
    "PROMEDIO BENEFICIADO",
    "COMPLEX",
    "TEMP PLATAFORMA VACIA",
    "TEMP PLATAFORMA",
    "TEMP CAMION",
    "TEMP AVES",
    "HEMATOMAS CON",
    "HEMATOMAS SIN",
    ...hematomaHeaders,
    ...lesionHeaders,
    ...pigmentacionHeaders,
    "SELECCION UNID",
    "SELECCION KG",
    "% SELECCION",
    "META",
    "VERIFICADOR",
    "OBSERVACIONES",
  ];

  const defectoHeaders = tiposDefecto.flatMap((t) => [t.nombre.toUpperCase(), `KG ${t.nombre.toUpperCase()}`]);

  const dataRows = inspecciones.map((insp) => {
    const fecha = insp.fecha ?? insp.jornada?.fecha ?? null;
    const anio = insp.anio ?? insp.jornada?.anio ?? null;
    const mes = insp.mes ?? insp.jornada?.mes ?? null;
    const semana = insp.semana ?? insp.jornada?.semana ?? null;
    const clienteNombre = insp.cliente?.nombre ?? insp.jornada?.cliente?.nombre ?? "";
    const verificadorNombre = insp.verificador?.nombre ?? insp.jornada?.verificador?.nombre ?? "";

    const defectosSeleccion = insp.defectos.filter((d) => !NOMBRES_MERMA_PASO7.includes(d.tipoDefecto.nombre));
    const totalUnidades = defectosSeleccion.reduce((acc, d) => acc + d.unidades, 0);
    const totalKg = defectosSeleccion.reduce((acc, d) => acc + d.kg, 0);
    const porcentaje = calcularPorcentajeSeleccion(totalUnidades, insp.cantidad);

    const defectoMap = new Map(insp.defectos.map((d) => [d.tipoDefectoId, d]));
    const hematomaMap = new Map(insp.hematomaDetalles.map((d) => [`${d.grado}_${d.ubicacion}`, d]));
    const lesionMap = new Map(insp.evaluacionesLesion.map((l) => [l.categoria, l]));

    const hematomaRow = HEMATOMA_GRADOS.flatMap((g) =>
      HEMATOMA_UBICACIONES.map((u) => hematomaMap.get(`${g.key}_${u.key}`)?.cantidad ?? 0)
    );

    const lesionRow = LESION_CATEGORIAS.flatMap((cat) => {
      const l = lesionMap.get(cat);
      return [l?.sinLesion ?? 0, l?.leve ?? 0, l?.grave ?? 0];
    });

    const pigmentacionRow = [
      insp.pigNivel0, insp.pigNivel1, insp.pigNivel2, insp.pigNivel3,
      insp.pigNivel4, insp.pigNivel5, insp.pigNivel6, insp.pigNivel7,
    ];

    const baseRow = [
      insp.id,
      anio ?? "",
      mes ?? "",
      semana ?? "",
      fecha ? fecha.toISOString().slice(0, 10) : "",
      clienteNombre,
      insp.plantel?.codigo ?? "",
      insp.galpon ?? "",
      insp.corral ?? "",
      insp.plantel?.tipoPlantel ?? "",
      insp.plantel?.zona ?? "",
      insp.plantel?.subZona ?? "",
      insp.plantel?.zonaEvaluacion ?? "",
      insp.campania ?? "",
      insp.nroGuia ?? "",
      insp.sexo ?? "",
      insp.jabas ?? "",
      insp.cantidad,
      insp.promVivo ?? "",
      insp.promBeneficiado ?? "",
      insp.complex ?? "",
      insp.tempPlataformaVacia ?? "",
      insp.tempPlataforma ?? "",
      insp.tempCamion ?? "",
      insp.tempAves ?? "",
      insp.hematomasCon ?? "",
      insp.hematomasSin ?? "",
      ...hematomaRow,
      ...lesionRow,
      ...pigmentacionRow,
      totalUnidades,
      totalKg.toFixed(2),
      porcentaje.toFixed(4),
      insp.metaPorcentaje,
      verificadorNombre,
      insp.observaciones ?? "",
    ];

    const defectoRow = tiposDefecto.flatMap((t) => {
      const d = defectoMap.get(t.id);
      return [d?.unidades ?? 0, d ? d.kg.toFixed(2) : "0"];
    });

    return { fecha, row: [...baseRow, ...defectoRow] };
  });

  dataRows.sort((a, b) => (b.fecha?.getTime() ?? 0) - (a.fecha?.getTime() ?? 0));

  const rows: (string | number)[][] = [[...baseHeaders, ...defectoHeaders], ...dataRows.map((d) => d.row)];

  return csvResponse(rows, "inspecciones");
}
