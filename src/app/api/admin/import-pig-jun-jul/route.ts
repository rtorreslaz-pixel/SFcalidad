import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { SexoAve } from "@/generated/prisma/enums";
import pigData from "./data.json";

// Ruta admin TEMPORAL: carga pigmentación de junio+julio 2026 (archivo SF_2).
// Actualiza pigNivel0-7 en la inspección que hace match (por plantel-galpón-corral-
// sexo-fecha); crea un registro solo-pigmentación si no hay match. Eliminar tras usar.
//   GET  -> dry-run.   GET ?apply=SI-CONFIRMO -> aplica.

type PigLote = {
  plantel: string; galpon: string; corral: string | null; sexo: "MACHO" | "HEMBRA";
  fecha: string; anio: number; mes: number; campania: string | null; cliente: string | null;
  pig: number[]; // 8 niveles (0-7)
};

const RANGO_DESDE = new Date(Date.UTC(2026, 5, 1));
const RANGO_HASTA = new Date(Date.UTC(2026, 7, 1));

const normG = (g: string | null) => {
  if (!g) return "";
  const s = String(g).trim().toUpperCase();
  return /^\d+$/.test(s) ? String(parseInt(s, 10)) : s;
};
const normC = (c: string | null) => (String(c ?? "").trim().toUpperCase() || "");
const keyOf = (p: string, g: string | null, c: string | null, s: string | null, fISO: string) =>
  `${(p ?? "").toUpperCase()}|${normG(g)}|${normC(c)}|${s ?? ""}|${fISO}`;

function pigFields(pig: number[]) {
  return {
    pigNivel0: pig[0] ?? 0, pigNivel1: pig[1] ?? 0, pigNivel2: pig[2] ?? 0, pigNivel3: pig[3] ?? 0,
    pigNivel4: pig[4] ?? 0, pigNivel5: pig[5] ?? 0, pigNivel6: pig[6] ?? 0, pigNivel7: pig[7] ?? 0,
  };
}
function abrevSexo(s: string) { return s === "MACHO" ? "M" : s === "HEMBRA" ? "H" : ""; }
function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  return 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000));
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPERVISOR") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const aplicar = req.nextUrl.searchParams.get("apply") === "SI-CONFIRMO";
  const lotes = pigData as PigLote[];

  const insp = await prisma.inspeccion.findMany({
    where: { fecha: { gte: RANGO_DESDE, lt: RANGO_HASTA } },
    select: { id: true, galpon: true, corral: true, sexo: true, fecha: true, plantel: { select: { codigo: true } } },
  });
  const idx = new Map<string, string>();
  for (const i of insp) {
    idx.set(keyOf(i.plantel?.codigo ?? "", i.galpon, i.corral, i.sexo, i.fecha!.toISOString().slice(0, 10)), i.id);
  }

  const conMatch = lotes.filter((l) => idx.has(keyOf(l.plantel, l.galpon, l.corral, l.sexo, l.fecha)));
  const sinMatch = lotes.filter((l) => !idx.has(keyOf(l.plantel, l.galpon, l.corral, l.sexo, l.fecha)));

  if (!aplicar) {
    return NextResponse.json({
      modo: "DRY-RUN (agrega ?apply=SI-CONFIRMO para aplicar)",
      lotesPigmentacion: lotes.length,
      actualizaraInspeccionExistente: conMatch.length,
      crearaSoloPigmentacion: sinMatch.length,
      ejemploSinMatch: sinMatch.slice(0, 5).map((l) => `${l.plantel}-${l.galpon}-${l.corral ?? ""}-${l.sexo}-${l.fecha}`),
      rango: "2026-06-01 → 2026-07-31",
    });
  }

  // Resolver entidades para los registros nuevos (solo-pigmentación)
  const [clientes, planteles, verifs, defaultVerif] = await Promise.all([
    prisma.cliente.findMany({ select: { id: true, nombre: true } }),
    prisma.plantel.findMany({ select: { id: true, codigo: true } }),
    prisma.user.findMany({ where: { role: "VERIFICADOR" }, select: { id: true } }),
    prisma.user.findFirst({ where: { role: "SUPERVISOR" }, select: { id: true } }),
  ]);
  const norm = (s: string) => s.trim().toUpperCase();
  const cliMap = new Map(clientes.map((c) => [norm(c.nombre), c.id]));
  const plaMap = new Map(planteles.map((p) => [norm(p.codigo), p.id]));
  const verifId = verifs[0]?.id ?? defaultVerif?.id ?? null;

  let actualizadas = 0, creadas = 0;
  for (const l of lotes) {
    const id = idx.get(keyOf(l.plantel, l.galpon, l.corral, l.sexo, l.fecha));
    if (id) {
      await prisma.inspeccion.update({ where: { id }, data: pigFields(l.pig) });
      actualizadas++;
    } else {
      const fecha = new Date(l.fecha + "T00:00:00.000Z");
      const plantelId = plaMap.get(norm(l.plantel)) ?? null;
      const clienteId = l.cliente ? cliMap.get(norm(l.cliente)) ?? null : null;
      await prisma.inspeccion.create({
        data: {
          fecha, anio: l.anio, mes: l.mes, semana: getISOWeek(fecha),
          campania: l.campania, clienteId, plantelId, galpon: l.galpon, corral: l.corral,
          sexo: l.sexo as SexoAve, verificadorId: verifId,
          soloLesionPigmentacion: true, estado: "COMPLETA",
          complex: [l.plantel, l.campania ?? "", l.galpon, abrevSexo(l.sexo), l.corral ?? ""].join("-").toUpperCase(),
          ...pigFields(l.pig),
        },
      });
      creadas++;
    }
  }
  return NextResponse.json({ ok: true, actualizadas, creadas });
}
