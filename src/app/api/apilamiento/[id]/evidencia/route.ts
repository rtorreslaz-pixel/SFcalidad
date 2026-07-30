import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { crearZip, nombreSeguro } from "@/lib/zip";

// Descarga en un ZIP todas las fotos y videos de una verificación, con nombres que dicen a qué
// ítem pertenece cada archivo. Requiere sesión, igual que ver la evidencia en pantalla.

const UPLOAD_ROOT = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("No autorizado", { status: 401 });

  const { id } = await params;
  const registro = await prisma.apilamientoRegistro.findUnique({
    where: { id },
    include: { cliente: { select: { nombre: true } }, medias: { orderBy: { createdAt: "asc" } } },
  });
  if (!registro) return new NextResponse("No encontrado", { status: 404 });
  if (registro.medias.length === 0) {
    return new NextResponse("Esta verificación no tiene fotos ni videos.", { status: 404 });
  }

  const contadorPorItem = new Map<string, number>();
  const entradas: { nombre: string; contenido: Buffer }[] = [];

  for (const media of registro.medias) {
    // El path guardado es /api/uploads/apilamiento/<registroId>/<archivo>: se traduce a disco.
    const relativo = media.path.replace(/^\/api\/uploads\//, "");
    const archivo = path.join(UPLOAD_ROOT, relativo);
    if (!archivo.startsWith(UPLOAD_ROOT + path.sep)) continue;

    const contenido = await readFile(archivo).catch(() => null);
    if (!contenido) continue; // archivo perdido: se omite en vez de romper la descarga

    const etiqueta = media.itemCodigo ?? "VENTILACION";
    const n = (contadorPorItem.get(etiqueta) ?? 0) + 1;
    contadorPorItem.set(etiqueta, n);

    entradas.push({
      nombre: `${etiqueta}_${n}${path.extname(archivo) || ".jpg"}`,
      contenido,
    });
  }

  if (entradas.length === 0) {
    return new NextResponse("No se encontraron los archivos de esta verificación.", { status: 404 });
  }

  const zip = crearZip(entradas, registro.fechaEvaluacion);
  const nombreZip = nombreSeguro(
    `${registro.codigoRegistro}-${registro.cliente.nombre}-${registro.local}`
  );

  return new NextResponse(new Uint8Array(zip), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${nombreZip}.zip"`,
      "Content-Length": String(zip.length),
    },
  });
}
