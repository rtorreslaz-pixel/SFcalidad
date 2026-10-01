import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireMobileUser } from "@/lib/auth";

// Anulación de pesajes desde la app. Se cometen errores en granja -- el ave se movió, se
// leyó mal la balanza, se registró dos veces -- y el verificador necesita corregir en el
// momento, sin esperar al supervisor.
//
// El registro NO se borra: se marca con quién y cuándo. Queda a la vista en rojo para poder
// auditarlo, pero sale de promedios, conteos y totales.
//
// Idempotente: anular algo ya anulado no cambia nada ni falla, así un reintento de red es
// inofensivo. Y no se "desanula" desde el celular: revertir es cosa del supervisor en la web.

const TIPOS = ["PREVENTA", "SACA", "GALLINA"] as const;
type Tipo = (typeof TIPOS)[number];

export async function POST(request: NextRequest) {
  const user = await requireMobileUser(request);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const tipo = body?.tipo;
  const ids = body?.ids;

  if (typeof tipo !== "string" || !TIPOS.includes(tipo as Tipo)) {
    return NextResponse.json({ error: `tipo debe ser uno de: ${TIPOS.join(", ")}` }, { status: 400 });
  }
  if (!Array.isArray(ids) || ids.length === 0 || !ids.every((i) => typeof i === "string")) {
    return NextResponse.json({ error: "ids debe ser un arreglo de cadenas no vacío" }, { status: 400 });
  }

  const anuladoEn = new Date();
  const datos = { anuladoEn, anuladoPorId: user.id };

  // Un verificador solo anula lo suyo; supervisor y jefe pueden anular cualquier registro.
  const soloPropios = user.role === "VERIFICADOR";

  let anulados = 0;
  if (tipo === "PREVENTA") {
    const r = await prisma.registroPesoPreventa.updateMany({
      where: {
        id: { in: ids },
        anuladoEn: null,
        ...(soloPropios ? { verificadorId: user.id } : {}),
      },
      data: datos,
    });
    anulados = r.count;
  } else if (tipo === "SACA") {
    const r = await prisma.sacaPesada.updateMany({
      where: {
        id: { in: ids },
        anuladoEn: null,
        ...(soloPropios ? { sacaMuestreo: { verificadorId: user.id } } : {}),
      },
      data: datos,
    });
    anulados = r.count;
  } else {
    const r = await prisma.gallinaPesada.updateMany({
      where: {
        id: { in: ids },
        anuladoEn: null,
        ...(soloPropios ? { despacho: { verificadorId: user.id } } : {}),
      },
      data: datos,
    });
    anulados = r.count;
  }

  // `anulados` puede ser menor que ids.length sin que haya error: los que ya estaban
  // anulados no se vuelven a tocar.
  return NextResponse.json({ anulados, recibidos: ids.length });
}
