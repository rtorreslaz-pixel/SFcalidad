import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { resolveExportUser, buildInspeccionWhere, csvResponse } from "@/lib/export-csv";

// Defectos de selección (no merma): nombre en BD → columnas en el CSV del analista
const SELECCION_MAP: { nombre: string; colUnid: string; colKg: string }[] = [
  { nombre: "Mío Pectoral",         colUnid: "MIO PECTORAL",       colKg: "kg MIO PECTORAL" },
  { nombre: "Mío Dorsal",           colUnid: "MIO DORSAL",         colKg: "kg MIO DORSAL" },
  { nombre: "Menor Peso",           colUnid: "MENOR PESO",         colKg: "kg MENOR PESO" },
  { nombre: "Deshidratado",         colUnid: "DESHIDRATADO",       colKg: "kg DESHIDRATADO" },
  { nombre: "Celulitis Abdominal",  colUnid: "CELULITIS ABD",      colKg: "kg CELULITIS ABD" },
  { nombre: "Golpeados Alas/Espalda",colUnid: "GOLPEADOS ALAS ESP",colKg: "kg GOLPEADOS" },
  { nombre: "Golpes Pechuga",       colUnid: "G PECHUGA",          colKg: "kg G. PECHUGA" },
  { nombre: "Golpes Pierna",        colUnid: "G PIERNA",           colKg: "kg G. PIERNA" },
  { nombre: "Úlceras",              colUnid: "ÚLCERAS",            colKg: "kg ÚLCERAS" },
  { nombre: "Buchón",               colUnid: "BUCHÓN",             colKg: "kg BUCHON" },
  { nombre: "Mutilados",            colUnid: "MUTILADOS",          colKg: "kg MUTILADOS" },
  { nombre: "Rasguños Severos",     colUnid: "RASGUÑOS SEVEROS",   colKg: "KG RASGUÑOS" },
];

const MERMA_MAP: { nombre: string; colUnid: string; colKg: string }[] = [
  { nombre: "Alas Grado 1°",   colUnid: "# ALAS 1°",     colKg: "Kg ALAS 1" },
  { nombre: "Alas Grado 2°",   colUnid: "# ALAS 2°",     colKg: "Kg ALAS 2" },
  { nombre: "Alas Grado 3°",   colUnid: "# ALAS 3°",     colKg: "Kg ALAS 3" },
  { nombre: "Alas Rota",       colUnid: "# ALAS ROTA",   colKg: "Kg ALAS ROTA" },
  { nombre: "Pierna Grado 1°", colUnid: "# PIERNA 1°",   colKg: "Kg PIERNA 1" },
  { nombre: "Pierna Grado 2°", colUnid: "# PIERNA 2°",   colKg: "Kg PIERNA 2" },
  { nombre: "Pierna Grado 3°", colUnid: "# PIERNA 3°",   colKg: "Kg PIERNA 3" },
  { nombre: "Pierna Rota",     colUnid: "# PIERNA ROTA", colKg: "Kg PIERNA ROTA" },
  { nombre: "Alas Mutiladas",  colUnid: "UNID ALAS MUTIL",     colKg: "KG ALAS MUTIL" },
  { nombre: "Piernas Mutiladas",colUnid: "UNID PIERNAS MUTIL", colKg: "KG PIERNAS MUTILADAS" },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const user = await resolveExportUser(request);
  const where = buildInspeccionWhere(searchParams, user);

  const inspecciones = await prisma.inspeccion.findMany({
    where,
    orderBy: { fecha: "desc" },
    include: {
      plantel: true,
      cliente: true,
      verificador: { select: { nombre: true } },
      defectos: { include: { tipoDefecto: true } },
      jornada: { include: { cliente: true, verificador: { select: { nombre: true } } } },
    },
  });

  const selHeaders = SELECCION_MAP.flatMap((m) => [m.colUnid, m.colKg]);
  const mermaHeaders = MERMA_MAP.flatMap((m) => [m.colUnid, m.colKg]);

  const headers = [
    "META",
    "AÑO", "MES", "SEMANA", "TIPO DE PLANTEL", "SUBZONA", "ZONA DE EVALUACION",
    "CAMPAÑA", "NRO GUIA", "FECHA", "CLIENTE", "PLANTEL", "GALPON", "SEXO",
    "CANTIDAD", "P. VIVO", "P. BENEFICIO",
    "SELECCIÓN UNID", "SELECCIÓN KG", "% SELECCIÓN", "SELECCIÓN TOTAL",
    ...selHeaders,
    ...mermaHeaders,
    "KILOS BENEFICIO", "KILOS BENEFICIO",
    "VERIFICADOR",
  ];

  const dataRows = inspecciones.map((insp) => {
    const fecha = insp.fecha ?? insp.jornada?.fecha ?? null;
    const clienteNombre = insp.cliente?.nombre ?? insp.jornada?.cliente?.nombre ?? "";
    const verificadorNombre = insp.verificador?.nombre ?? insp.jornada?.verificador?.nombre ?? "";

    const defectoMap = new Map(insp.defectos.map((d) => [d.tipoDefecto.nombre, d]));

    const MERMA_NOMBRES = new Set(MERMA_MAP.map((m) => m.nombre));
    const selDefectos = insp.defectos.filter((d) => !MERMA_NOMBRES.has(d.tipoDefecto.nombre));
    const totalSelUnid = selDefectos.reduce((s, d) => s + d.unidades, 0);
    const totalSelKg = selDefectos.reduce((s, d) => s + d.kg, 0);
    const pctSel = insp.cantidad > 0 ? totalSelUnid / insp.cantidad : 0;

    const selRow = SELECCION_MAP.flatMap((m) => {
      const d = defectoMap.get(m.nombre);
      return [d?.unidades ?? 0, d ? d.kg.toFixed(2) : "0"];
    });

    const mermaRow = MERMA_MAP.flatMap((m) => {
      const d = defectoMap.get(m.nombre);
      return [d?.unidades ?? 0, d ? d.kg.toFixed(2) : "0"];
    });

    const kilosVivo = insp.cantidad && insp.promVivo ? insp.cantidad * insp.promVivo : "";
    const kilosBenef = insp.cantidad && insp.promBeneficiado ? insp.cantidad * insp.promBeneficiado : "";

    return {
      fecha,
      row: [
        insp.metaPorcentaje,
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
        insp.cantidad,
        insp.promVivo ?? "",
        insp.promBeneficiado ?? "",
        totalSelUnid,
        totalSelKg.toFixed(2),
        pctSel.toFixed(4),
        pctSel.toFixed(4),
        ...selRow,
        ...mermaRow,
        kilosVivo,
        kilosBenef,
        verificadorNombre,
      ],
    };
  });

  dataRows.sort((a, b) => (b.fecha?.getTime() ?? 0) - (a.fecha?.getTime() ?? 0));

  const rows: (string | number)[][] = [headers, ...dataRows.map((d) => d.row)];
  return csvResponse(rows, "seleccion");
}
