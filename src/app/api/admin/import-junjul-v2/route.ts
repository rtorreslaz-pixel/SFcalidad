import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { SexoAve, CategoriaLesion } from "@/generated/prisma/enums";
import loteData from "./data.json";

// Ruta admin TEMPORAL (v2): recarga junio+julio 2026 desde los 5 archivos, esta vez
// con el galpón normalizado (sin ceros a la izquierda) para que selección, hematomas,
// temperatura, pododermatitis/rasguños y pigmentación crucen en el MISMO lote.
// Borra jun+jul 2026 y reinserta. GET dry-run; GET ?apply=SI-CONFIRMO aplica.

type Lote = {
  fecha: string; anio: number; mes: number; campania: string | null; nroGuia: string | null;
  cliente: string | null; plantel: string | null; galpon: string | null; corral: string | null; sexo: "MACHO" | "HEMBRA" | null;
  cantidad: number; promVivo: number | null; promBeneficiado: number | null; metaPorcentaje: number; verificador: string | null;
  hematomasCon: number | null; hematomasSin: number | null;
  tempCamion: number | null; tempPlataforma: number | null; tempPlataformaVacia: number | null; densidad: number | null;
  pig: number[];
  defectos: { nombre: string; unidades: number; kg: number }[];
  lesiones: { categoria: "ALMOHADILLAS" | "RASGUNOS"; sexo: "MACHO" | "HEMBRA"; sinLesion: number; leve: number; grave: number; muestra: number }[];
  soloLesionPigmentacion: boolean;
};

const RANGO_DESDE = new Date(Date.UTC(2026, 5, 1));
const RANGO_HASTA = new Date(Date.UTC(2026, 7, 1));

const abrevSexo = (s: string | null) => (s === "MACHO" ? "M" : s === "HEMBRA" ? "H" : "");
const buildComplex = (l: Lote) =>
  [l.plantel ?? "", l.campania ?? "", l.galpon ?? "", abrevSexo(l.sexo), l.corral ?? ""].join("-").toUpperCase();
function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const ft = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  return 1 + Math.round((d.getTime() - ft.getTime()) / (7 * 24 * 3600 * 1000));
}

async function resolver() {
  const [clientes, planteles, verifs, tipos, supervisor] = await Promise.all([
    prisma.cliente.findMany({ select: { id: true, nombre: true } }),
    prisma.plantel.findMany({ select: { id: true, codigo: true } }),
    prisma.user.findMany({ where: { role: "VERIFICADOR" }, select: { id: true, nombre: true } }),
    prisma.tipoDefecto.findMany({ select: { id: true, nombre: true } }),
    prisma.user.findFirst({ where: { role: "SUPERVISOR" }, select: { id: true } }),
  ]);
  const n = (s: string) => s.trim().toUpperCase();
  return {
    clientes: new Map(clientes.map((c) => [n(c.nombre), c.id])),
    planteles: new Map(planteles.map((p) => [n(p.codigo), p.id])),
    verifs: new Map(verifs.map((v) => [n(v.nombre), v.id])),
    tipos: new Map(tipos.map((t) => [n(t.nombre), t.id])),
    defaultVerif: verifs[0]?.id ?? supervisor?.id ?? null,
  };
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPERVISOR") return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const aplicar = req.nextUrl.searchParams.get("apply") === "SI-CONFIRMO";
  const lotes = loteData as Lote[];
  const r = await resolver();

  const existentes = await prisma.inspeccion.count({ where: { fecha: { gte: RANGO_DESDE, lt: RANGO_HASTA } } });
  const clientesFaltantes = [...new Set(lotes.map((l) => l.cliente).filter((c): c is string => !!c))].filter((c) => !r.clientes.has(c.trim().toUpperCase()));

  if (!aplicar) {
    return NextResponse.json({
      modo: "DRY-RUN (agrega ?apply=SI-CONFIRMO para aplicar)",
      seBorraran: existentes,
      seInsertaran: lotes.length,
      conSeleccion: lotes.filter((l) => !l.soloLesionPigmentacion).length,
      soloLesionPig: lotes.filter((l) => l.soloLesionPigmentacion).length,
      conPigmentacion: lotes.filter((l) => l.pig.reduce((a, b) => a + b, 0) > 0).length,
      clientesQueSeCrearan: clientesFaltantes,
      rango: "2026-06-01 → 2026-07-31",
    });
  }

  for (const nombre of [...new Set(lotes.map((l) => l.cliente).filter((c): c is string => !!c))]) {
    if (!r.clientes.has(nombre.trim().toUpperCase())) {
      const c = await prisma.cliente.create({ data: { nombre: nombre.trim() } });
      r.clientes.set(nombre.trim().toUpperCase(), c.id);
    }
  }

  const viejos = await prisma.inspeccion.findMany({ where: { fecha: { gte: RANGO_DESDE, lt: RANGO_HASTA } }, select: { id: true } });
  const ids = viejos.map((v) => v.id);
  if (ids.length > 0) {
    await prisma.$transaction([
      prisma.defectoRegistro.deleteMany({ where: { inspeccionId: { in: ids } } }),
      prisma.foto.deleteMany({ where: { inspeccionId: { in: ids } } }),
      prisma.hematomaDetalle.deleteMany({ where: { inspeccionId: { in: ids } } }),
      prisma.evaluacionLesion.deleteMany({ where: { inspeccionId: { in: ids } } }),
      prisma.inspeccion.deleteMany({ where: { id: { in: ids } } }),
    ]);
  }

  let insertadas = 0;
  for (const l of lotes) {
    const plantelId = l.plantel ? r.planteles.get(l.plantel.trim().toUpperCase()) ?? null : null;
    const clienteId = l.cliente ? r.clientes.get(l.cliente.trim().toUpperCase()) ?? null : null;
    const verificadorId = (l.verificador ? r.verifs.get(l.verificador.trim().toUpperCase()) : null) ?? r.defaultVerif;
    const fecha = new Date(l.fecha + "T00:00:00.000Z");
    const vistos = new Set<string>();
    const defectosData = l.defectos
      .map((d) => ({ tipoDefectoId: r.tipos.get(d.nombre.trim().toUpperCase()), unidades: d.unidades, kg: d.kg }))
      .filter((d): d is { tipoDefectoId: string; unidades: number; kg: number } => !!d.tipoDefectoId)
      .filter((d) => (vistos.has(d.tipoDefectoId) ? false : (vistos.add(d.tipoDefectoId), true)));

    await prisma.inspeccion.create({
      data: {
        fecha, anio: l.anio, mes: l.mes, semana: getISOWeek(fecha), campania: l.campania, nroGuia: l.nroGuia,
        clienteId, plantelId, galpon: l.galpon, corral: l.corral, sexo: l.sexo as SexoAve | null,
        cantidad: l.cantidad, promVivo: l.promVivo, promBeneficiado: l.promBeneficiado, metaPorcentaje: l.metaPorcentaje, verificadorId,
        hematomasCon: l.hematomasCon, hematomasSin: l.hematomasSin,
        tempCamion: l.tempCamion, tempPlataforma: l.tempPlataforma, tempPlataformaVacia: l.tempPlataformaVacia, densidad: l.densidad,
        pigNivel0: l.pig[0] ?? 0, pigNivel1: l.pig[1] ?? 0, pigNivel2: l.pig[2] ?? 0, pigNivel3: l.pig[3] ?? 0,
        pigNivel4: l.pig[4] ?? 0, pigNivel5: l.pig[5] ?? 0, pigNivel6: l.pig[6] ?? 0, pigNivel7: l.pig[7] ?? 0,
        soloLesionPigmentacion: l.soloLesionPigmentacion, complex: buildComplex(l), estado: "COMPLETA",
        defectos: { create: defectosData },
        evaluacionesLesion: {
          create: l.lesiones.map((le) => ({ categoria: le.categoria as CategoriaLesion, sexo: le.sexo as SexoAve, sinLesion: le.sinLesion, leve: le.leve, grave: le.grave, muestra: le.muestra })),
        },
      },
    });
    insertadas++;
  }
  return NextResponse.json({ ok: true, borradas: ids.length, insertadas });
}
