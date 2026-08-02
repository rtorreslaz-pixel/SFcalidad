import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { resolveExportUser, tablaResponse } from "@/lib/export-csv";
import { complexLoteFromComplex } from "@/lib/complex-entity";
import { construirWhereSaca, leerFiltrosSaca } from "@/lib/saca-filtros";

// Descarga del reporte de saca: una fila por PESADA, con los datos del muestreo, el neto/
// promedio de la pesada y la comparación contra el promedio de preventa del mismo lote.
// Misma autenticación que las demás exportaciones (token de BI o sesión; un VERIFICADOR
// solo descarga lo suyo). Acepta los mismos filtros que la pantalla (desde/hasta/plantel):
// lo que se ve en el reporte es lo que se descarga.

const CATEGORIA_LABEL: Record<string, string> = { MACHO: "Macho", HEMBRA: "Hembra", MEDIANO: "Mediano" };

function fecha(d: Date | null | undefined): string {
  if (!d) return "";
  return d.toISOString().replace("T", " ").slice(0, 19);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const user = await resolveExportUser(request);

  const where = construirWhereSaca(
    leerFiltrosSaca({
      desde: searchParams.get("desde") ?? undefined,
      hasta: searchParams.get("hasta") ?? undefined,
      plantel: searchParams.get("plantel") ?? undefined,
    }),
  );
  if (user?.role === "VERIFICADOR") where.verificadorId = user.id;

  const muestreos = await prisma.sacaMuestreo.findMany({
    where,
    orderBy: { fecha: "desc" },
    include: {
      plantel: { select: { codigo: true, nombre: true } },
      verificador: { select: { nombre: true } },
      pesadas: { orderBy: { fechaHora: "asc" } },
    },
  });

  // Promedio de preventa por lote (complexLote) para la columna de comparación.
  const preventa = await prisma.registroPesoPreventa.findMany({
    where: { complex: { not: null }, pesoGramos: { not: null } },
    select: { complex: true, pesoGramos: true },
  });
  const pvPorLote = new Map<string, { suma: number; n: number }>();
  for (const r of preventa) {
    const clave = complexLoteFromComplex(r.complex);
    if (!clave || r.pesoGramos == null) continue;
    const e = pvPorLote.get(clave) ?? { suma: 0, n: 0 };
    e.suma += r.pesoGramos;
    e.n += 1;
    pvPorLote.set(clave, e);
  }

  const headers = [
    "ID MUESTREO",
    "FECHA SACA",
    "PLANTEL",
    "NOMBRE PLANTEL",
    "CAMPAÑA",
    "GALPÓN",
    "CATEGORÍA",
    "COMPLEX LOTE",
    "EDAD (días)",
    "AVES POR JABA",
    "TARA POR JABA (g)",
    "TIPO JABA",
    "N° PESADA",
    "HORA PESADA",
    "JABAS",
    "AVES",
    "BRUTO (g)",
    "TARA TOTAL (g)",
    "NETO (g)",
    "PROMEDIO PESADA (g/ave)",
    "PROMEDIO PREVENTA LOTE (g/ave)",
    "DIFERENCIA (g)",
    "VERIFICADOR",
  ];

  const rows: (string | number)[][] = [headers];
  for (const m of muestreos) {
    const pv = m.complexLote ? pvPorLote.get(m.complexLote) : undefined;
    const promPreventa = pv && pv.n > 0 ? pv.suma / pv.n : null;
    m.pesadas.forEach((p, i) => {
      rows.push([
        m.id,
        fecha(m.fecha),
        m.plantel.codigo,
        m.plantel.nombre ?? "",
        m.campania ?? "",
        m.galpon,
        CATEGORIA_LABEL[m.categoria] ?? m.categoria,
        m.complexLote ?? "",
        m.edad ?? "",
        m.avesPorJaba,
        m.taraGramosPorJaba,
        m.tipoJaba ?? "",
        i + 1,
        fecha(p.fechaHora),
        p.numJabas,
        p.avesTotal,
        Math.round(p.pesoBrutoGramos),
        Math.round(m.taraGramosPorJaba * p.numJabas),
        Math.round(p.pesoNetoGramos),
        Math.round(p.promedioGramos),
        promPreventa != null ? Math.round(promPreventa) : "",
        promPreventa != null ? Math.round(p.promedioGramos - promPreventa) : "",
        m.verificador.nombre,
      ]);
    });
  }

  return tablaResponse(rows, "saca", searchParams, "Pesaje de saca");
}
