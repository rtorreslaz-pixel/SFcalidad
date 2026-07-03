import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

// Muro de monitoreo: una fila por balanza (= por verificador con lectura viva),
// combinando el peso en vivo (LiveWeightReading) con los agregados del lote de HOY
// (RegistroPesoPreventa). Alimenta /dashboard/pesaje, que hace polling cada 2s.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const soloPropias = user.role === "VERIFICADOR";
  const whereLive: Prisma.LiveWeightReadingWhereInput = soloPropias ? { verificadorId: user.id } : {};

  const lecturas = await prisma.liveWeightReading.findMany({
    where: whereLive,
    include: { verificador: { select: { id: true, nombre: true } } },
    orderBy: { updatedAt: "desc" },
  });

  // Agregados del lote de hoy por (verificador, complex): cantidad de aves y peso promedio.
  const hoyInicio = new Date();
  hoyInicio.setHours(0, 0, 0, 0);

  const verificadorIds = lecturas.map((l) => l.verificadorId);
  const registrosHoy =
    verificadorIds.length > 0
      ? await prisma.registroPesoPreventa.findMany({
          where: { verificadorId: { in: verificadorIds }, fechaHora: { gte: hoyInicio } },
          select: { verificadorId: true, complex: true, pesoGramos: true },
        })
      : [];

  // Clave verificadorId + complex → { count, sumaPeso }
  const agg = new Map<string, { count: number; sumaPeso: number }>();
  for (const r of registrosHoy) {
    const key = `${r.verificadorId}||${r.complex ?? ""}`;
    const e = agg.get(key) ?? { count: 0, sumaPeso: 0 };
    e.count += 1;
    e.sumaPeso += r.pesoGramos;
    agg.set(key, e);
  }

  const balanzas = lecturas.map((l) => {
    const key = `${l.verificadorId}||${l.complex ?? ""}`;
    const e = agg.get(key);
    const avesLote = e?.count ?? 0;
    const pesoPromedioLote = e && e.count > 0 ? e.sumaPeso / e.count : null;
    return {
      verificador: l.verificador.nombre,
      pesoGramos: l.pesoGramos,
      campania: l.campania,
      plantelCodigo: l.plantelCodigo,
      galpon: l.galpon,
      corral: l.corral,
      categoria: l.categoria,
      complex: l.complex,
      avesLote,
      pesoPromedioLote,
      updatedAt: l.updatedAt.toISOString(),
    };
  });

  return NextResponse.json({ balanzas });
}
