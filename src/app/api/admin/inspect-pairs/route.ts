import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPERVISOR") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const ids: string[] = body.ids;
  if (!Array.isArray(ids)) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const inspecciones = await prisma.inspeccion.findMany({
    where: { id: { in: ids } },
    include: {
      defectos: { include: { tipoDefecto: true } },
      fotos: true,
      hematomaDetalles: true,
      evaluacionesLesion: true,
    },
  });

  return NextResponse.json({ inspecciones });
}
