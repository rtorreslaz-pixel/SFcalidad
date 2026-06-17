import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { calcularPorcentajeSeleccion } from "@/lib/calc";
import type { Prisma } from "@/generated/prisma/client";

function csvEscape(value: string | number | null | undefined): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function tokenMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const expectedToken = process.env.EXPORT_API_TOKEN;
  const providedToken = searchParams.get("token");
  const tokenAuthorized = !!expectedToken && !!providedToken && tokenMatches(providedToken, expectedToken);

  const user = tokenAuthorized ? null : await getCurrentUser();
  if (!tokenAuthorized && !user) redirect("/login");

  const where: Prisma.InspeccionWhereInput = {};
  if (user?.role === "VERIFICADOR") {
    where.verificadorId = user.id;
  } else if (searchParams.get("verificadorId")) {
    where.verificadorId = searchParams.get("verificadorId")!;
  }
  if (searchParams.get("clienteId")) where.clienteId = searchParams.get("clienteId")!;
  const desde = searchParams.get("desde");
  const hasta = searchParams.get("hasta");
  if (desde || hasta) {
    where.fecha = {};
    if (desde) where.fecha.gte = new Date(desde);
    if (hasta) where.fecha.lte = new Date(hasta + "T23:59:59");
  }

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

  const tiposDefecto = await prisma.tipoDefecto.findMany({ orderBy: { orden: "asc" } });

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
    "JABAS",
    "CANTIDAD",
    "PROMEDIO VIVO",
    "PROMEDIO BENEFICIADO",
    "COMPLEX",
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

    const totalUnidades = insp.defectos.reduce((acc, d) => acc + d.unidades, 0);
    const totalKg = insp.defectos.reduce((acc, d) => acc + d.kg, 0);
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
      insp.jabas ?? "",
      insp.cantidad,
      insp.promVivo ?? "",
      insp.promBeneficiado ?? "",
      insp.complex ?? "",
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

  const csv = rows.map((row) => row.map(csvEscape).join(";")).join("\n");
  const bom = "﻿"; // para que Excel reconozca UTF-8

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inspecciones_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
