import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireMobileUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await requireMobileUser(request);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const planteles = await prisma.plantel.findMany({
    select: { id: true, codigo: true, nombre: true, cliente: { select: { nombre: true } } },
    orderBy: { codigo: "asc" },
  });

  return NextResponse.json({
    planteles: planteles.map((p) => ({
      id: p.id,
      codigo: p.codigo,
      nombre: p.nombre,
      cliente: p.cliente.nombre,
    })),
  });
}
