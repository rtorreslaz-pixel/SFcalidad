import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Ruta admin TEMPORAL: elimina los registros de peso preventa de PRUEBA (id 'seed-*')
// que el seed creaba en cada arranque. Los datos reales (sync de la app Android) NO se
// tocan. GET dry-run; GET ?apply=SI-CONFIRMO aplica. Eliminar tras usar.
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPERVISOR") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const aplicar = req.nextUrl.searchParams.get("apply") === "SI-CONFIRMO";

  const total = await prisma.registroPesoPreventa.count();
  const prueba = await prisma.registroPesoPreventa.count({ where: { id: { startsWith: "seed-" } } });
  const reales = total - prueba;

  if (!aplicar) {
    return NextResponse.json({
      modo: "DRY-RUN (agrega ?apply=SI-CONFIRMO para aplicar)",
      registrosPesoPreventaTotal: total,
      dePrueba_seSeBorraran: prueba,
      realesQueSeConservan: reales,
    });
  }

  const res = await prisma.registroPesoPreventa.deleteMany({ where: { id: { startsWith: "seed-" } } });
  const restantes = await prisma.registroPesoPreventa.count();
  return NextResponse.json({ ok: true, borradosDePrueba: res.count, registrosRealesRestantes: restantes });
}
