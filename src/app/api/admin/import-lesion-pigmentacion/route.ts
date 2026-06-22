import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getISOWeek } from "@/lib/calc";

type Sexo = "MACHO" | "HEMBRA";

type LesionPayload = { grado0: number; grado1: number; grado2: number; muestra: number };
type LesionRowIn = {
  fecha: string;
  cliente: string;
  plantelCodigo: string;
  galpon: string | null;
  sexo: Sexo;
  podo: LesionPayload | null;
  rasguno: LesionPayload | null;
};
type PigRowIn = {
  fecha: string;
  cliente: string;
  plantelCodigo: string;
  galpon: string | null;
  sexo: Sexo;
  niveles: number[];
  total: number;
};

type RowIn = LesionRowIn | PigRowIn;

function parts(code: string | null): string[] {
  if (!code) return [];
  return code
    .split(/\s+Y\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

// Algunos planteles/galpones históricos combinan dos códigos en un solo campo ("251 Y 250"),
// mientras que las planillas de lesión/pigmentación los listan como filas separadas.
function codesOverlap(a: string | null, b: string | null): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  const pa = parts(a);
  const pb = parts(b);
  return pa.some((x) => pb.includes(x));
}

type Candidato = {
  id: string;
  fecha: Date | null;
  galpon: string | null;
  sexo: Sexo | null;
  cliente: { nombre: string } | null;
  plantel: { codigo: string } | null;
};

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPERVISOR") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const tipo: "lesion" | "pigmentacion" = body.tipo;
  if ((tipo !== "lesion" && tipo !== "pigmentacion") || !Array.isArray(body.rows)) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }
  const rows: RowIn[] = body.rows;

  const inspecciones: Candidato[] = await prisma.inspeccion.findMany({
    select: {
      id: true,
      fecha: true,
      galpon: true,
      sexo: true,
      cliente: { select: { nombre: true } },
      plantel: { select: { codigo: true } },
    },
  });

  const byFechaSexo = new Map<string, Candidato[]>();
  for (const insp of inspecciones) {
    if (!insp.fecha || !insp.sexo) continue;
    const key = `${insp.fecha.toISOString().slice(0, 10)}|${insp.sexo}`;
    const arr = byFechaSexo.get(key);
    if (arr) arr.push(insp);
    else byFechaSexo.set(key, [insp]);
  }

  const [clientes, planteles] = await Promise.all([prisma.cliente.findMany(), prisma.plantel.findMany()]);
  const clienteIdByNombre = new Map(clientes.map((c) => [c.nombre, c.id]));
  const plantelIdByCodigo = new Map(planteles.map((p) => [p.codigo, p.id]));

  let matched = 0;
  let created = 0;
  const ambiguous: { index: number; row: RowIn; candidatos: string[] }[] = [];
  const errors: { index: number; error: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const key = `${row.fecha}|${row.sexo}`;
      const candidates = (byFechaSexo.get(key) ?? []).filter(
        (insp) =>
          insp.cliente?.nombre === row.cliente &&
          codesOverlap(insp.plantel?.codigo ?? null, row.plantelCodigo) &&
          codesOverlap(insp.galpon, row.galpon)
      );

      if (candidates.length === 1) {
        await aplicarPayload(tipo, candidates[0].id, row);
        matched++;
      } else if (candidates.length === 0) {
        let clienteId = clienteIdByNombre.get(row.cliente);
        if (!clienteId) {
          const nuevoCliente = await prisma.cliente.create({ data: { nombre: row.cliente } });
          clienteId = nuevoCliente.id;
          clienteIdByNombre.set(row.cliente, clienteId);
        }
        let plantelId = plantelIdByCodigo.get(row.plantelCodigo);
        if (!plantelId) {
          const nuevoPlantel = await prisma.plantel.create({ data: { codigo: row.plantelCodigo } });
          plantelId = nuevoPlantel.id;
          plantelIdByCodigo.set(row.plantelCodigo, plantelId);
        }

        const fecha = new Date(row.fecha);
        const cantidad =
          tipo === "lesion"
            ? (row as LesionRowIn).podo?.muestra ?? (row as LesionRowIn).rasguno?.muestra ?? 0
            : (row as PigRowIn).total;

        const nueva = await prisma.inspeccion.create({
          data: {
            fecha,
            anio: fecha.getFullYear(),
            mes: fecha.getMonth() + 1,
            semana: getISOWeek(fecha),
            clienteId,
            plantelId,
            galpon: row.galpon,
            sexo: row.sexo,
            cantidad,
          },
        });

        await aplicarPayload(tipo, nueva.id, row);
        created++;
      } else {
        ambiguous.push({ index: i, row, candidatos: candidates.map((c) => c.id) });
      }
    } catch (e) {
      errors.push({ index: i, error: e instanceof Error ? e.message : String(e) });
    }
  }

  return NextResponse.json({ matched, created, ambiguous, errors });
}

async function aplicarPayload(tipo: "lesion" | "pigmentacion", inspeccionId: string, row: RowIn) {
  if (tipo === "lesion") {
    const r = row as LesionRowIn;
    if (r.podo) {
      await prisma.evaluacionLesion.upsert({
        where: { inspeccionId_categoria_sexo: { inspeccionId, categoria: "ALMOHADILLAS", sexo: r.sexo } },
        create: {
          inspeccionId,
          categoria: "ALMOHADILLAS",
          sexo: r.sexo,
          muestra: r.podo.muestra,
          sinLesion: r.podo.grado0,
          leve: r.podo.grado1,
          grave: r.podo.grado2,
        },
        update: {
          muestra: r.podo.muestra,
          sinLesion: r.podo.grado0,
          leve: r.podo.grado1,
          grave: r.podo.grado2,
        },
      });
    }
    if (r.rasguno) {
      await prisma.evaluacionLesion.upsert({
        where: { inspeccionId_categoria_sexo: { inspeccionId, categoria: "RASGUNOS", sexo: r.sexo } },
        create: {
          inspeccionId,
          categoria: "RASGUNOS",
          sexo: r.sexo,
          muestra: r.rasguno.muestra,
          sinLesion: r.rasguno.grado0,
          leve: r.rasguno.grado1,
          grave: r.rasguno.grado2,
        },
        update: {
          muestra: r.rasguno.muestra,
          sinLesion: r.rasguno.grado0,
          leve: r.rasguno.grado1,
          grave: r.rasguno.grado2,
        },
      });
    }
  } else {
    const r = row as PigRowIn;
    await prisma.inspeccion.update({
      where: { id: inspeccionId },
      data: {
        pigNivel0: r.niveles[0],
        pigNivel1: r.niveles[1],
        pigNivel2: r.niveles[2],
        pigNivel3: r.niveles[3],
        pigNivel4: r.niveles[4],
        pigNivel5: r.niveles[5],
        pigNivel6: r.niveles[6],
      },
    });
  }
}
