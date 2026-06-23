import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

type Sexo = "MACHO" | "HEMBRA";

type RowIn = {
  fecha: string;
  cliente: string;
  plantelCodigo: string;
  galpon: string | null;
  sexo: Sexo;
  tempVehiculo: number | null;
  tempPlataformaVacia: number | null;
  tempPlataformaLlena: number | null;
};

function parts(code: string | null): string[] {
  if (!code) return [];
  return code
    .split(/\s+Y\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

// Algunos planteles/galpones históricos combinan dos códigos en un solo campo ("251 Y 250"),
// mientras que la planilla de temperaturas los lista como filas separadas.
function codesOverlap(a: string | null, b: string | null): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  const pa = parts(a);
  const pb = parts(b);
  return pa.some((x) => pb.includes(x));
}

type Candidato = {
  id: string;
  fecha: string | null;
  galpon: string | null;
  sexo: Sexo | null;
  cliente: string | null;
  plantelCodigo: string | null;
};

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPERVISOR") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json();
  if (!Array.isArray(body.rows)) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }
  const rows: RowIn[] = body.rows;
  const apply: boolean = body.apply === true;

  // Las inspecciones creadas desde el flujo de jornadas no guardan su propia
  // fecha/clienteId (sólo viven en la jornada), así que el matching debe
  // usar el valor "efectivo" igual que en /inspecciones y el export CSV.
  const inspecciones = await prisma.inspeccion.findMany({
    select: {
      id: true,
      fecha: true,
      galpon: true,
      sexo: true,
      cliente: { select: { nombre: true } },
      plantel: { select: { codigo: true } },
      jornada: { select: { fecha: true, cliente: { select: { nombre: true } } } },
    },
  });

  const byFechaSexo = new Map<string, Candidato[]>();
  for (const insp of inspecciones) {
    const fecha = insp.fecha ?? insp.jornada?.fecha ?? null;
    const cliente = insp.cliente?.nombre ?? insp.jornada?.cliente?.nombre ?? null;
    if (!fecha || !insp.sexo) continue;
    const key = `${fecha.toISOString().slice(0, 10)}|${insp.sexo}`;
    const candidato: Candidato = {
      id: insp.id,
      fecha: fecha.toISOString().slice(0, 10),
      galpon: insp.galpon,
      sexo: insp.sexo,
      cliente,
      plantelCodigo: insp.plantel?.codigo ?? null,
    };
    const arr = byFechaSexo.get(key);
    if (arr) arr.push(candidato);
    else byFechaSexo.set(key, [candidato]);
  }

  let matched = 0;
  let ambiguous = 0;
  let sinMatch = 0;
  const ambiguousSamples: { row: RowIn; candidatos: string[] }[] = [];
  const sinMatchSamples: RowIn[] = [];
  const errors: { index: number; error: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const key = `${row.fecha}|${row.sexo}`;
      const candidates = (byFechaSexo.get(key) ?? []).filter(
        (insp) =>
          insp.cliente === row.cliente &&
          codesOverlap(insp.plantelCodigo, row.plantelCodigo) &&
          codesOverlap(insp.galpon, row.galpon)
      );

      if (candidates.length === 1) {
        matched++;
        if (apply) {
          const data: Record<string, number> = {};
          if (row.tempVehiculo !== null) data.tempCamion = row.tempVehiculo;
          if (row.tempPlataformaLlena !== null) data.tempPlataforma = row.tempPlataformaLlena;
          if (row.tempPlataformaVacia !== null) data.tempPlataformaVacia = row.tempPlataformaVacia;
          if (Object.keys(data).length > 0) {
            await prisma.inspeccion.update({ where: { id: candidates[0].id }, data });
          }
        }
      } else if (candidates.length === 0) {
        sinMatch++;
        if (sinMatchSamples.length < 30) sinMatchSamples.push(row);
      } else {
        ambiguous++;
        if (ambiguousSamples.length < 30) {
          ambiguousSamples.push({ row, candidatos: candidates.map((c) => c.id) });
        }
      }
    } catch (e) {
      errors.push({ index: i, error: e instanceof Error ? e.message : String(e) });
    }
  }

  return NextResponse.json({
    apply,
    total: rows.length,
    matched,
    ambiguous,
    sinMatch,
    ambiguousSamples,
    sinMatchSamples,
    errors,
  });
}
