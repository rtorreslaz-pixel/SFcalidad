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
    },
  });

  const tiposDefecto = await prisma.tipoDefecto.findMany({ orderBy: { orden: "asc" } });

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
    "CANTIDAD",
    "SELECCION UNID",
    "SELECCION KG",
    "% SELECCION",
    "META",
    "VERIFICADOR",
    "OBSERVACIONES",
  ];

  const defectoHeaders = tiposDefecto.flatMap((t) => [t.nombre.toUpperCase(), `KG ${t.nombre.toUpperCase()}`]);

  const rows: (string | number)[][] = [[...baseHeaders, ...defectoHeaders]];

  for (const insp of inspecciones) {
    const totalUnidades = insp.defectos.reduce((acc, d) => acc + d.unidades, 0);
    const totalKg = insp.defectos.reduce((acc, d) => acc + d.kg, 0);
    const porcentaje = calcularPorcentajeSeleccion(totalUnidades, insp.cantidad);

    const defectoMap = new Map(insp.defectos.map((d) => [d.tipoDefectoId, d]));

    const baseRow = [
      insp.anio ?? "",
      insp.mes ?? "",
      insp.semana ?? "",
      insp.fecha ? insp.fecha.toISOString().slice(0, 10) : "",
      insp.cliente?.nombre ?? "",
      insp.plantel?.codigo ?? "",
      insp.galpon ?? "",
      insp.plantel?.tipoPlantel ?? "",
      insp.plantel?.zona ?? "",
      insp.plantel?.subZona ?? "",
      insp.plantel?.zonaEvaluacion ?? "",
      insp.campania ?? "",
      insp.nroGuia ?? "",
      insp.sexo ?? "",
      insp.cantidad,
      totalUnidades,
      totalKg.toFixed(2),
      porcentaje.toFixed(4),
      insp.metaPorcentaje,
      insp.verificador?.nombre ?? "",
      insp.observaciones ?? "",
    ];

    const defectoRow = tiposDefecto.flatMap((t) => {
      const d = defectoMap.get(t.id);
      return [d?.unidades ?? 0, d ? d.kg.toFixed(2) : "0"];
    });

    rows.push([...baseRow, ...defectoRow]);
  }

  const csv = rows.map((row) => row.map(csvEscape).join(";")).join("\n");
  const bom = "﻿"; // para que Excel reconozca UTF-8

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inspecciones_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
