import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const where: Prisma.LiveWeightReadingWhereInput =
    user.role === "VERIFICADOR" ? { verificadorId: user.id } : {};

  const lecturas = await prisma.liveWeightReading.findMany({
    where,
    include: { verificador: { select: { nombre: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    lecturas: lecturas.map((l) => ({
      verificador: l.verificador.nombre,
      pesoGramos: l.pesoGramos,
      plantelCodigo: l.plantelCodigo,
      galpon: l.galpon,
      corral: l.corral,
      categoria: l.categoria,
      updatedAt: l.updatedAt.toISOString(),
    })),
  });
}
