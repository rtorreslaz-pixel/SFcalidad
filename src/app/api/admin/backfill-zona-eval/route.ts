import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import mapa from "./data.json";

// Ruta admin TEMPORAL: rellena Plantel.zonaEvaluacion en los planteles que la tienen
// vacía (null), usando el mapa plantel→zona de evaluación extraído de los archivos.
// NO toca los planteles que ya tienen valor. Eliminar tras usar.
//   GET  -> dry-run.   GET ?apply=SI-CONFIRMO -> aplica.

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPERVISOR") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const aplicar = req.nextUrl.searchParams.get("apply") === "SI-CONFIRMO";
  const map = mapa as Record<string, string>;

  const nulls = await prisma.plantel.findMany({
    where: { zonaEvaluacion: null },
    select: { id: true, codigo: true },
  });
  const aLlenar = nulls.filter((p) => map[p.codigo.toUpperCase()]);
  const sinDato = nulls.filter((p) => !map[p.codigo.toUpperCase()]);

  if (!aplicar) {
    return NextResponse.json({
      modo: "DRY-RUN (agrega ?apply=SI-CONFIRMO para aplicar)",
      plantelesConZonaEvalVacia: nulls.length,
      seLlenaran: aLlenar.length,
      quedaranSinDato: sinDato.map((p) => p.codigo),
      ejemplos: aLlenar.slice(0, 10).map((p) => `${p.codigo} → ${map[p.codigo.toUpperCase()]}`),
    });
  }

  let actualizados = 0;
  for (const p of aLlenar) {
    await prisma.plantel.update({
      where: { id: p.id },
      data: { zonaEvaluacion: map[p.codigo.toUpperCase()] },
    });
    actualizados++;
  }
  return NextResponse.json({ ok: true, actualizados, sinDato: sinDato.map((p) => p.codigo) });
}
