import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPERVISOR") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const rows = await prisma.$queryRaw<
    {
      galpon: string | null;
      corral: string | null;
      plantelId: string | null;
      plantelCodigo: string | null;
      count: bigint;
    }[]
  >`
    SELECT
      i.galpon,
      i.corral,
      i.plantelId,
      p.codigo AS plantelCodigo,
      COUNT(*) AS count
    FROM "Inspeccion" i
    LEFT JOIN "Plantel" p ON p.id = i.plantelId
    GROUP BY i.galpon, i.corral, i.plantelId, p.codigo
    ORDER BY count DESC
  `;

  const sinPlantel = await prisma.inspeccion.count({ where: { plantelId: null } });
  const sinGalpon  = await prisma.inspeccion.count({ where: { galpon: null } });
  const total      = await prisma.inspeccion.count();

  // Detectar patrones sospechosos: galpon que termina en letra y corral vacío
  const sospechosos = rows.filter((r) => {
    if (!r.galpon) return false;
    if (r.corral) return false; // ya tiene corral separado
    return /\d[A-Za-z]+$/.test(r.galpon); // termina en letra(s) luego de un número
  });

  return NextResponse.json({
    total,
    sinPlantel,
    sinGalpon,
    combinaciones: rows.map((r) => ({
      plantelCodigo: r.plantelCodigo,
      galpon: r.galpon,
      corral: r.corral,
      count: Number(r.count),
    })),
    sospechosos: sospechosos.map((r) => ({
      plantelCodigo: r.plantelCodigo,
      galpon: r.galpon,
      corral: r.corral,
      count: Number(r.count),
    })),
  });
}
