import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireMobileUser } from "@/lib/auth";
import { CategoriaAve } from "@/generated/prisma/enums";
import { buildComplexLote } from "@/lib/complex-entity";

// Sincronización de los muestreos de saca que levanta la app en granja (~40+ días): el equipo
// muestrea algunas jabas y de ahí sale el peso promedio por ave. Cada muestreo llega con sus
// pesadas. Igual que /api/mobile/registros, el id lo genera el celular (UUID) para que un
// reintento de red no duplique: si el muestreo ya existe, se ignora.

type PesadaInput = {
  id: string;
  numJabas: number;
  pesoBrutoGramos: number;
  pesoNetoGramos: number;
  avesTotal: number;
  promedioGramos: number;
  fechaHora: string;
};

type MuestreoInput = {
  id: string;
  plantelId: string;
  campania?: string | null;
  galpon: string;
  categoria: string;
  fecha: string;
  edad?: number | null;
  avesPorJaba: number;
  taraGramosPorJaba: number;
  tipoJaba?: string | null;
  pesadas: PesadaInput[];
};

function esNumero(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function esPesadaValida(p: unknown): p is PesadaInput {
  if (typeof p !== "object" || p === null) return false;
  const v = p as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.numJabas === "number" &&
    Number.isInteger(v.numJabas) &&
    v.numJabas > 0 &&
    esNumero(v.pesoBrutoGramos) &&
    esNumero(v.pesoNetoGramos) &&
    typeof v.avesTotal === "number" &&
    Number.isInteger(v.avesTotal) &&
    v.avesTotal > 0 &&
    esNumero(v.promedioGramos) &&
    typeof v.fechaHora === "string" &&
    !Number.isNaN(Date.parse(v.fechaHora))
  );
}

function esMuestreoValido(m: unknown): m is MuestreoInput {
  if (typeof m !== "object" || m === null) return false;
  const v = m as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.plantelId === "string" &&
    (v.campania === undefined || v.campania === null || typeof v.campania === "string") &&
    typeof v.galpon === "string" &&
    typeof v.categoria === "string" &&
    Object.values(CategoriaAve).includes(v.categoria as CategoriaAve) &&
    typeof v.fecha === "string" &&
    !Number.isNaN(Date.parse(v.fecha)) &&
    (v.edad === undefined || v.edad === null || (typeof v.edad === "number" && Number.isInteger(v.edad) && v.edad >= 0)) &&
    typeof v.avesPorJaba === "number" &&
    Number.isInteger(v.avesPorJaba) &&
    v.avesPorJaba > 0 &&
    esNumero(v.taraGramosPorJaba) &&
    (v.tipoJaba === undefined || v.tipoJaba === null || typeof v.tipoJaba === "string") &&
    Array.isArray(v.pesadas) &&
    v.pesadas.length > 0 &&
    v.pesadas.every(esPesadaValida)
  );
}

export async function POST(request: NextRequest) {
  const user = await requireMobileUser(request);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const muestreos = body?.muestreos;
  if (!Array.isArray(muestreos) || muestreos.length === 0) {
    return NextResponse.json({ error: "muestreos debe ser un arreglo no vacío" }, { status: 400 });
  }
  if (!muestreos.every(esMuestreoValido)) {
    return NextResponse.json({ error: "Uno o más muestreos tienen campos inválidos" }, { status: 400 });
  }

  const plantelIds = [...new Set(muestreos.map((m) => m.plantelId))];
  const planteles = await prisma.plantel.findMany({
    where: { id: { in: plantelIds } },
    select: { id: true, codigo: true },
  });
  if (planteles.length !== plantelIds.length) {
    return NextResponse.json({ error: "Uno o más plantelId no existen" }, { status: 400 });
  }
  const codigoPorPlantel = new Map(planteles.map((p) => [p.id, p.codigo]));

  const ids: string[] = [];
  for (const m of muestreos) {
    // Idempotente: si el muestreo ya se subió, no se vuelve a crear ni se duplican pesadas.
    const existente = await prisma.sacaMuestreo.findUnique({ where: { id: m.id }, select: { id: true } });
    if (existente) {
      ids.push(existente.id);
      continue;
    }

    await prisma.$transaction(async (tx) => {
      await tx.sacaMuestreo.create({
        data: {
          id: m.id,
          plantelId: m.plantelId,
          campania: m.campania ?? null,
          galpon: m.galpon,
          categoria: m.categoria as CategoriaAve,
          // Clave de cruce con preventa: Plantel-Campaña-Galpón-Categoría (sin corral).
          complexLote: buildComplexLote({
            plantelCodigo: codigoPorPlantel.get(m.plantelId) ?? null,
            campania: m.campania ?? null,
            galpon: m.galpon,
            categoria: m.categoria as CategoriaAve,
          }),
          fecha: new Date(m.fecha),
          edad: m.edad ?? null,
          avesPorJaba: m.avesPorJaba,
          taraGramosPorJaba: m.taraGramosPorJaba,
          tipoJaba: m.tipoJaba ?? null,
          verificadorId: user.id,
        },
      });

      for (const p of m.pesadas) {
        await tx.sacaPesada.create({
          data: {
            id: p.id,
            sacaMuestreoId: m.id,
            numJabas: p.numJabas,
            pesoBrutoGramos: p.pesoBrutoGramos,
            pesoNetoGramos: p.pesoNetoGramos,
            avesTotal: p.avesTotal,
            promedioGramos: p.promedioGramos,
            fechaHora: new Date(p.fechaHora),
          },
        });
      }
    });

    ids.push(m.id);
  }

  return NextResponse.json({ ingested: ids.length, ids });
}
