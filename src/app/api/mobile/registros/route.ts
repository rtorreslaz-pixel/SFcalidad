import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireMobileUser } from "@/lib/auth";
import { CategoriaAve } from "@/generated/prisma/enums";

type RegistroInput = {
  id: string;
  plantelId: string;
  galpon: string;
  corral: string;
  categoria: string;
  numeroAve: number;
  pesoGramos: number;
  fechaHora: string;
};

function isValidRegistro(r: unknown): r is RegistroInput {
  if (typeof r !== "object" || r === null) return false;
  const v = r as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.plantelId === "string" &&
    typeof v.galpon === "string" &&
    typeof v.corral === "string" &&
    typeof v.categoria === "string" &&
    Object.values(CategoriaAve).includes(v.categoria as CategoriaAve) &&
    typeof v.numeroAve === "number" &&
    typeof v.pesoGramos === "number" &&
    typeof v.fechaHora === "string" &&
    !Number.isNaN(Date.parse(v.fechaHora))
  );
}

export async function POST(request: NextRequest) {
  const user = await requireMobileUser(request);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const registros = body?.registros;
  if (!Array.isArray(registros) || registros.length === 0) {
    return NextResponse.json({ error: "registros debe ser un arreglo no vacío" }, { status: 400 });
  }
  if (!registros.every(isValidRegistro)) {
    return NextResponse.json({ error: "Uno o más registros tienen campos inválidos" }, { status: 400 });
  }

  const plantelIds = [...new Set(registros.map((r) => r.plantelId))];
  const planteles = await prisma.plantel.findMany({
    where: { id: { in: plantelIds } },
    select: { id: true },
  });
  if (planteles.length !== plantelIds.length) {
    return NextResponse.json({ error: "Uno o más plantelId no existen" }, { status: 400 });
  }

  const ids = await prisma.$transaction(
    registros.map((r) =>
      prisma.registroPesoPreventa.upsert({
        where: { id: r.id },
        update: {},
        create: {
          id: r.id,
          plantelId: r.plantelId,
          galpon: r.galpon,
          corral: r.corral,
          categoria: r.categoria as CategoriaAve,
          numeroAve: r.numeroAve,
          pesoGramos: r.pesoGramos,
          fechaHora: new Date(r.fechaHora),
          verificadorId: user.id,
        },
        select: { id: true },
      })
    )
  );

  return NextResponse.json({ ingested: ids.length, ids: ids.map((r) => r.id) });
}
