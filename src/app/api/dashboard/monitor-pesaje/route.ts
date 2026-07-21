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
          // Solo registros con peso (los de solo calidad no aportan al promedio de pesaje).
          where: { verificadorId: { in: verificadorIds }, fechaHora: { gte: hoyInicio }, pesoGramos: { not: null } },
          select: { verificadorId: true, complex: true, pesoGramos: true },
        })
      : [];

  // Clave verificadorId + complex → { count, sumaPeso }
  const agg = new Map<string, { count: number; sumaPeso: number }>();
  for (const r of registrosHoy) {
    const key = `${r.verificadorId}||${r.complex ?? ""}`;
    const e = agg.get(key) ?? { count: 0, sumaPeso: 0 };
    e.count += 1;
    e.sumaPeso += r.pesoGramos ?? 0;
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

  // Modo demo (DEMO_MODE=true, solo el despliegue de demostración): el monitor es
  // en tiempo real, así que las lecturas sembradas se volverían "viejas" tras 2 min.
  // Para que el demo siempre muestre básculas activas, se marca cada lectura como
  // recién actualizada y se agrega un pequeño ruido al peso (como una celda de carga).
  if (process.env.DEMO_MODE === "true") {
    const ahora = new Date().toISOString();
    const balanzasDemo = balanzas.map((b) => ({
      ...b,
      pesoGramos: Math.round(b.pesoGramos + (Math.random() - 0.5) * 16),
      updatedAt: ahora,
    }));
    return NextResponse.json({ balanzas: balanzasDemo });
  }

  return NextResponse.json({ balanzas });
}
