import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireMobileUser } from "@/lib/auth";
import { ordenarPorCodigo } from "@/lib/gallina";

export async function GET(request: NextRequest) {
  const user = await requireMobileUser(request);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // Clientes y materiales los usa el módulo de gallina, que pesa el despacho en el local
  // del cliente y no en granja: ahí no hay plantel, hay guía y placa.
  const [planteles, pesosEstandar, clientes, materiales] = await Promise.all([
    prisma.plantel.findMany({
      select: { id: true, codigo: true, nombre: true, cliente: { select: { nombre: true } } },
      orderBy: { codigo: "asc" },
    }),
    prisma.pesoEstandar.findMany({
      select: { linea: true, sexo: true, edadDias: true, pesoGramos: true },
      orderBy: [{ linea: "asc" }, { sexo: "asc" }, { edadDias: "asc" }],
    }),
    prisma.cliente.findMany({ select: { id: true, nombre: true }, orderBy: { nombre: "asc" } }),
    prisma.materialGallina.findMany({
      where: { activo: true },
      select: { id: true, codigo: true, descripcion: true },
    }),
  ]);

  return NextResponse.json({
    planteles: planteles.map((p) => ({
      id: p.id,
      codigo: p.codigo,
      nombre: p.nombre,
      cliente: p.cliente?.nombre ?? null,
    })),
    pesosEstandar,
    clientes,
    materiales: ordenarPorCodigo(materiales),
  });
}
