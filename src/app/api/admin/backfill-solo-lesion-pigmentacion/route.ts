import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Herramienta de un solo uso: marca soloLesionPigmentacion=true en las inspecciones
// creadas por el import de pododermatitis/rasguños y pigmentación (las que no traen
// censo de selección/merma: promVivo nulo y sin DefectoRegistro). Por defecto solo
// reporta los conteos; usar ?apply=true para ejecutar el update.
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPERVISOR") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const apply = new URL(request.url).searchParams.get("apply") === "true";

  const candidatos = await prisma.inspeccion.findMany({
    where: { promVivo: null, defectos: { none: {} } },
    select: { id: true },
  });
  const candidatoIds = new Set(candidatos.map((c) => c.id));

  // Chequeos de falsos positivos/negativos antes de tocar nada.
  const promVivoNullConDefectos = await prisma.inspeccion.count({
    where: { promVivo: null, defectos: { some: {} } },
  });
  const promVivoSetSinDefectos = await prisma.inspeccion.count({
    where: { promVivo: { not: null }, defectos: { none: {} } },
  });
  const yaMarcadas = await prisma.inspeccion.count({ where: { soloLesionPigmentacion: true } });

  if (!apply) {
    return NextResponse.json({
      apply: false,
      candidatos: candidatoIds.size,
      promVivoNullConDefectos,
      promVivoSetSinDefectos,
      yaMarcadas,
    });
  }

  const result = await prisma.inspeccion.updateMany({
    where: { promVivo: null, defectos: { none: {} } },
    data: { soloLesionPigmentacion: true },
  });

  return NextResponse.json({
    apply: true,
    candidatos: candidatoIds.size,
    actualizadas: result.count,
    promVivoNullConDefectos,
    promVivoSetSinDefectos,
  });
}
