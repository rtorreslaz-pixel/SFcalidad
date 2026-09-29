import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireMobileUser } from "@/lib/auth";

// Sincronización del módulo GALLINA: el pesaje de gallina de descarte en el despacho al
// cliente. Cada despacho (una guía, una placa) llega con sus pesadas; cada pesada trae el
// peso de las jabas vacías y el de esas mismas jabas con las gallinas dentro.
//
// Igual que /api/mobile/saca, el id lo genera el celular (UUID) para que un reintento de red
// no duplique: si el despacho ya existe, se ignora.

type PesadaInput = {
  id: string;
  jabas: number;
  pesoDestareGramos: number;
  pesoConAveGramos: number;
  fechaHora: string;
};

type DespachoInput = {
  id: string;
  clienteId: string;
  materialId: string;
  fecha: string;
  guiaReferencia: string;
  placa: string;
  densidad: number;
  pesadas: PesadaInput[];
};

function esNumero(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function esEnteroPositivo(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v > 0;
}

function esPesadaValida(p: unknown): p is PesadaInput {
  if (typeof p !== "object" || p === null) return false;
  const v = p as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    esEnteroPositivo(v.jabas) &&
    esNumero(v.pesoDestareGramos) &&
    v.pesoDestareGramos >= 0 &&
    esNumero(v.pesoConAveGramos) &&
    // Las gallinas pesan: si el peso con ave no supera al de las jabas vacías, algo se
    // capturó al revés y conviene rechazarlo antes de que ensucie el promedio.
    v.pesoConAveGramos > v.pesoDestareGramos &&
    typeof v.fechaHora === "string" &&
    !Number.isNaN(Date.parse(v.fechaHora))
  );
}

function esDespachoValido(d: unknown): d is DespachoInput {
  if (typeof d !== "object" || d === null) return false;
  const v = d as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.clienteId === "string" &&
    typeof v.materialId === "string" &&
    typeof v.fecha === "string" &&
    !Number.isNaN(Date.parse(v.fecha)) &&
    typeof v.guiaReferencia === "string" &&
    v.guiaReferencia.trim().length > 0 &&
    typeof v.placa === "string" &&
    v.placa.trim().length > 0 &&
    esEnteroPositivo(v.densidad) &&
    Array.isArray(v.pesadas) &&
    v.pesadas.length > 0 &&
    v.pesadas.every(esPesadaValida)
  );
}

export async function POST(request: NextRequest) {
  const user = await requireMobileUser(request);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const despachos = body?.despachos;
  if (!Array.isArray(despachos) || despachos.length === 0) {
    return NextResponse.json({ error: "despachos debe ser un arreglo no vacío" }, { status: 400 });
  }
  if (!despachos.every(esDespachoValido)) {
    return NextResponse.json({ error: "Uno o más despachos tienen campos inválidos" }, { status: 400 });
  }

  const clienteIds = [...new Set(despachos.map((d) => d.clienteId))];
  const materialIds = [...new Set(despachos.map((d) => d.materialId))];
  const [clientes, materiales] = await Promise.all([
    prisma.cliente.findMany({ where: { id: { in: clienteIds } }, select: { id: true } }),
    prisma.materialGallina.findMany({ where: { id: { in: materialIds } }, select: { id: true } }),
  ]);
  if (clientes.length !== clienteIds.length) {
    return NextResponse.json({ error: "Uno o más clienteId no existen" }, { status: 400 });
  }
  if (materiales.length !== materialIds.length) {
    return NextResponse.json({ error: "Uno o más materialId no existen" }, { status: 400 });
  }

  const ids: string[] = [];
  for (const d of despachos) {
    // Idempotente: si el despacho ya se subió, no se vuelve a crear ni se duplican pesadas.
    const existente = await prisma.gallinaDespacho.findUnique({ where: { id: d.id }, select: { id: true } });
    if (existente) {
      ids.push(existente.id);
      continue;
    }

    await prisma.$transaction(async (tx) => {
      await tx.gallinaDespacho.create({
        data: {
          id: d.id,
          clienteId: d.clienteId,
          materialId: d.materialId,
          fecha: new Date(d.fecha),
          guiaReferencia: d.guiaReferencia.trim(),
          placa: d.placa.trim().toUpperCase(),
          densidad: d.densidad,
          verificadorId: user.id,
        },
      });

      // El neto, las unidades y el promedio se calculan AQUÍ y no se toman del celular:
      // así una versión vieja de la app no puede meter cuentas distintas a las del reporte.
      await tx.gallinaPesada.createMany({
        data: d.pesadas.map((p) => {
          const neto = p.pesoConAveGramos - p.pesoDestareGramos;
          const unidades = p.jabas * d.densidad;
          return {
            id: p.id,
            despachoId: d.id,
            jabas: p.jabas,
            pesoDestareGramos: p.pesoDestareGramos,
            pesoConAveGramos: p.pesoConAveGramos,
            pesoNetoGramos: neto,
            unidades,
            promedioGramos: neto / unidades,
            fechaHora: new Date(p.fechaHora),
          };
        }),
      });
    });

    ids.push(d.id);
  }

  return NextResponse.json({ ingested: ids.length, ids });
}
