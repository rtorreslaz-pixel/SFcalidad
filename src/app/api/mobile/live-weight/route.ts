import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireMobileUser } from "@/lib/auth";
import { CategoriaAve } from "@/generated/prisma/enums";
import { buildComplexEntity } from "@/lib/complex-entity";

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

  const plantelCodigo = asOptionalString(body?.plantelCodigo);
  const campania = asOptionalString(body?.campania);
  const galpon = asOptionalString(body?.galpon);
  const corral = asOptionalString(body?.corral);

  const data = {
    pesoGramos,
    plantelCodigo,
    campania,
    galpon,
    corral,
    categoria,
    complex: buildComplexEntity({ plantelCodigo, campania, galpon, categoria, corral }),
  };

  await prisma.liveWeightReading.upsert({
    where: { verificadorId: user.id },
    update: data,
    create: { verificadorId: user.id, ...data },
  });

  return NextResponse.json({ ok: true });
}
