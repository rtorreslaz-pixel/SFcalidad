import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireMobileUser } from "@/lib/auth";
import { CategoriaAve } from "@/generated/prisma/enums";

// El celular usa esto como piso para el "siguiente número de ave" de un corral:
// su contador local (Room) se pierde si la app se reinstala o se borra su storage,
// pero el servidor sigue teniendo el máximo real ya sincronizado.
export async function GET(request: NextRequest) {
  const user = await requireMobileUser(request);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const plantelId = searchParams.get("plantelId");
  const campania = searchParams.get("campania");
  const galpon = searchParams.get("galpon");
  const corral = searchParams.get("corral");
  const categoria = searchParams.get("categoria");

  if (
    !plantelId ||
    !campania ||
    !galpon ||
    !corral ||
    !categoria ||
    !Object.values(CategoriaAve).includes(categoria as CategoriaAve)
  ) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const result = await prisma.registroPesoPreventa.aggregate({
    where: { plantelId, campania, galpon, corral, categoria: categoria as CategoriaAve },
    _max: { numeroAve: true },
  });

  return NextResponse.json({ maxNumeroAve: result._max.numeroAve });
}
