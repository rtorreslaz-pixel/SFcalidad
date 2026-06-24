import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireMobileUser } from "@/lib/auth";
import { CategoriaAve } from "@/generated/prisma/enums";

function asOptionalString(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

export async function POST(request: NextRequest) {
  const user = await requireMobileUser(request);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const pesoGramos = body?.pesoGramos;
  if (typeof pesoGramos !== "number" || !Number.isFinite(pesoGramos)) {
    return NextResponse.json({ error: "pesoGramos debe ser un número" }, { status: 400 });
  }

  const categoria =
    typeof body?.categoria === "string" && Object.values(CategoriaAve).includes(body.categoria)
      ? (body.categoria as CategoriaAve)
      : null;

  const data = {
    pesoGramos,
    plantelCodigo: asOptionalString(body?.plantelCodigo),
    galpon: asOptionalString(body?.galpon),
    corral: asOptionalString(body?.corral),
    categoria,
  };

  await prisma.liveWeightReading.upsert({
    where: { verificadorId: user.id },
    update: data,
    create: { verificadorId: user.id, ...data },
  });

  return NextResponse.json({ ok: true });
}
