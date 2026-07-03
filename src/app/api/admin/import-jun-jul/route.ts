import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { SexoAve, CategoriaLesion } from "@/generated/prisma/enums";
import loteData from "./data.json";

// Ruta admin TEMPORAL: recarga junio+julio 2026 desde los 4 archivos consolidados
// (selección, hematomas, temperatura, pododermatitis/rasguños). Borra lo existente
// de ese rango y reinserta. Eliminar tras completar la carga.
//   GET  ?dry=1  -> reporte de lo que haría, sin escribir (por defecto).
//   POST         -> aplica los cambios.

type Lote = {
  fecha: string; anio: number; mes: number; campania: string | null; nroGuia: string | null;
  cliente: string | null; plantel: string | null; galpon: string | null; corral: string | null;
  sexo: "MACHO" | "HEMBRA" | null;
  cantidad: number; promVivo: number | null; promBeneficiado: number | null; metaPorcentaje: number;
  verificador: string | null;
  hematomasCon: number | null; hematomasSin: number | null;
  tempCamion: number | null; tempPlataforma: number | null; tempPlataformaVacia: number | null; densidad: number | null;
  defectos: { nombre: string; unidades: number; kg: number }[];
  lesiones: { categoria: "ALMOHADILLAS" | "RASGUNOS"; sexo: "MACHO" | "HEMBRA"; sinLesion: number; leve: number; grave: number; muestra: number }[];
  soloLesionPigmentacion: boolean;
};

const RANGO_DESDE = new Date(Date.UTC(2026, 5, 1)); // 2026-06-01
const RANGO_HASTA = new Date(Date.UTC(2026, 7, 1)); // 2026-08-01 (exclusivo)

function abrevSexo(s: string | null): string {
  return s === "MACHO" ? "M" : s === "HEMBRA" ? "H" : "";
}
function buildComplex(l: Lote, plantelCodigo: string | null): string {
  return [plantelCodigo ?? "", l.campania ?? "", l.galpon ?? "", abrevSexo(l.sexo), l.corral ?? ""]
    .join("-")
    .toUpperCase();
}
function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  return 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000));
}

async function resolver() {
  const [clientes, planteles, verifs, tipos, supervisor] = await Promise.all([
    prisma.cliente.findMany({ select: { id: true, nombre: true } }),
    prisma.plantel.findMany({ select: { id: true, codigo: true } }),
    prisma.user.findMany({ where: { role: "VERIFICADOR" }, select: { id: true, nombre: true } }),
    prisma.tipoDefecto.findMany({ select: { id: true, nombre: true } }),
    prisma.user.findFirst({ where: { role: "SUPERVISOR" }, select: { id: true } }),
  ]);
  const norm = (s: string) => s.trim().toUpperCase();
  return {
    clientes: new Map(clientes.map((c) => [norm(c.nombre), c.id])),
    planteles: new Map(planteles.map((p) => [norm(p.codigo), p.id])),
    verifs: new Map(verifs.map((v) => [norm(v.nombre), v.id])),
    tipos: new Map(tipos.map((t) => [norm(t.nombre), t.id])),
    defaultVerif: verifs[0]?.id ?? supervisor?.id ?? null,
  };
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPERVISOR") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const aplicar = req.nextUrl.searchParams.get("apply") === "SI-CONFIRMO";
  const lotes = loteData as Lote[];
  const r = await resolver();

  const existentes = await prisma.inspeccion.count({ where: { fecha: { gte: RANGO_DESDE, lt: RANGO_HASTA } } });
  const clientesFaltantes = [...new Set(lotes.map((l) => l.cliente).filter(Boolean).map((c) => c as string))]
    .filter((c) => !r.clientes.has(c.trim().toUpperCase()));
  const plantelesFaltantes = [...new Set(lotes.map((l) => l.plantel).filter(Boolean).map((p) => p as string))]
    .filter((p) => !r.planteles.has(p.trim().toUpperCase()));

  if (!aplicar) {
    return NextResponse.json({
      modo: "DRY-RUN (agrega ?apply=SI-CONFIRMO para aplicar)",
      inspeccionesExistentesQueSeBorraran: existentes,
      lotesAInsertar: lotes.length,
      conSeleccion: lotes.filter((l) => !l.soloLesionPigmentacion).length,
      soloLesion: lotes.filter((l) => l.soloLesionPigmentacion).length,
      totalDefectos: lotes.reduce((a, l) => a + l.defectos.length, 0),
      totalLesiones: lotes.reduce((a, l) => a + l.lesiones.length, 0),
      clientesQueSeCrearan: clientesFaltantes,
      plantelesFaltantes,
      rango: "2026-06-01 → 2026-07-31",
    });
  }

  // Crear clientes faltantes (p.ej. GAYFA)
  for (const nombre of [...new Set(lotes.map((l) => l.cliente).filter((c): c is string => !!c))]) {
    if (!r.clientes.has(nombre.trim().toUpperCase())) {
      const c = await prisma.cliente.create({ data: { nombre: nombre.trim() } });
      r.clientes.set(nombre.trim().toUpperCase(), c.id);
    }
  }

  // Borrar junio+julio 2026 existentes (hijos primero, por si el PRAGMA de FK está off)
  const viejos = await prisma.inspeccion.findMany({
    where: { fecha: { gte: RANGO_DESDE, lt: RANGO_HASTA } },
    select: { id: true },
  });
  const viejosIds = viejos.map((v) => v.id);
  let borradas = 0;
  if (viejosIds.length > 0) {
    await prisma.$transaction([
      prisma.defectoRegistro.deleteMany({ where: { inspeccionId: { in: viejosIds } } }),
      prisma.foto.deleteMany({ where: { inspeccionId: { in: viejosIds } } }),
      prisma.hematomaDetalle.deleteMany({ where: { inspeccionId: { in: viejosIds } } }),
      prisma.evaluacionLesion.deleteMany({ where: { inspeccionId: { in: viejosIds } } }),
      prisma.inspeccion.deleteMany({ where: { id: { in: viejosIds } } }),
    ]);
    borradas = viejosIds.length;
  }

  // Insertar los lotes consolidados
  let insertadas = 0, sinPlantel = 0, sinCliente = 0;
  for (const l of lotes) {
    const plantelId = l.plantel ? r.planteles.get(l.plantel.trim().toUpperCase()) ?? null : null;
    const clienteId = l.cliente ? r.clientes.get(l.cliente.trim().toUpperCase()) ?? null : null;
    if (!plantelId) sinPlantel++;
    if (!clienteId) sinCliente++;
    const verificadorId = (l.verificador ? r.verifs.get(l.verificador.trim().toUpperCase()) : null) ?? r.defaultVerif;
    const fecha = new Date(l.fecha + "T00:00:00.000Z");

    const vistos = new Set<string>();
    const defectosData = l.defectos
      .map((d) => ({ tipoDefectoId: r.tipos.get(d.nombre.trim().toUpperCase()), unidades: d.unidades, kg: d.kg }))
      .filter((d): d is { tipoDefectoId: string; unidades: number; kg: number } => !!d.tipoDefectoId)
      .filter((d) => (vistos.has(d.tipoDefectoId) ? false : (vistos.add(d.tipoDefectoId), true))); // dedup por unique [inspeccionId, tipoDefectoId]

    await prisma.inspeccion.create({
      data: {
        fecha,
        anio: l.anio,
        mes: l.mes,
        semana: getISOWeek(fecha),
        campania: l.campania,
        nroGuia: l.nroGuia,
        clienteId,
        plantelId,
        galpon: l.galpon,
        corral: l.corral,
        sexo: l.sexo as SexoAve | null,
        cantidad: l.cantidad,
        promVivo: l.promVivo,
        promBeneficiado: l.promBeneficiado,
        metaPorcentaje: l.metaPorcentaje,
        verificadorId,
        hematomasCon: l.hematomasCon,
        hematomasSin: l.hematomasSin,
        tempCamion: l.tempCamion,
        tempPlataforma: l.tempPlataforma,
        tempPlataformaVacia: l.tempPlataformaVacia,
        densidad: l.densidad,
        soloLesionPigmentacion: l.soloLesionPigmentacion,
        complex: buildComplex(l, l.plantel),
        estado: "COMPLETA",
        defectos: { create: defectosData },
        evaluacionesLesion: {
          create: l.lesiones.map((le) => ({
            categoria: le.categoria as CategoriaLesion,
            sexo: le.sexo as SexoAve,
            sinLesion: le.sinLesion,
            leve: le.leve,
            grave: le.grave,
            muestra: le.muestra,
          })),
        },
      },
    });
    insertadas++;
  }

  return NextResponse.json({ ok: true, borradas, insertadas, sinPlantel, sinCliente });
}
