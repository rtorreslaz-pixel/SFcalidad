import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { crearZip, nombreSeguro } from "@/lib/zip";
import { construirWhere, describirFiltros, leerFiltros } from "@/lib/apilamiento-filtros";

// Descarga en un solo ZIP la evidencia (fotos y videos) de TODAS las verificaciones que
// coinciden con los filtros del reporte: cliente, rango de fechas y semáforo. Cada verificación
// va en su propia carpeta dentro del ZIP.

const UPLOAD_ROOT = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");

// El ZIP se arma en memoria, así que se acota: una descarga enorme podría tumbar el servidor.
// Si se llega al tope, se incluye igual lo que entró y un LEEME explicando qué faltó.
const MAX_ARCHIVOS = 400;
const MAX_BYTES = 250 * 1024 * 1024; // 250 MB

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("No autorizado", { status: 401 });

  const { searchParams } = new URL(request.url);
  const filtros = leerFiltros(searchParams);

  const registros = await prisma.apilamientoRegistro.findMany({
    where: construirWhere(filtros),
    orderBy: { fechaEvaluacion: "desc" },
    include: { cliente: { select: { nombre: true } }, medias: { orderBy: { createdAt: "asc" } } },
  });

  const nombreCliente = filtros.clienteId ? registros[0]?.cliente.nombre : undefined;
  const descripcion = describirFiltros(filtros, nombreCliente);

  const entradas: { nombre: string; contenido: Buffer }[] = [];
  const omitidos: string[] = [];
  let bytes = 0;
  let topeAlcanzado = false;

  for (const r of registros) {
    if (topeAlcanzado) {
      if (r.medias.length > 0) omitidos.push(`${r.codigoRegistro} (${r.local})`);
      continue;
    }

    const carpeta = nombreSeguro(`${r.codigoRegistro}_${r.cliente.nombre}_${r.local}`);
    const contadorPorItem = new Map<string, number>();

    for (const media of r.medias) {
      const relativo = media.path.replace(/^\/api\/uploads\//, "");
      const archivo = path.join(UPLOAD_ROOT, relativo);
      if (!archivo.startsWith(UPLOAD_ROOT + path.sep)) continue;

      const contenido = await readFile(archivo).catch(() => null);
      if (!contenido) continue; // archivo perdido: se omite en vez de romper la descarga

      if (entradas.length >= MAX_ARCHIVOS || bytes + contenido.length > MAX_BYTES) {
        topeAlcanzado = true;
        omitidos.push(`${r.codigoRegistro} (${r.local})`);
        break;
      }

      const etiqueta = media.itemCodigo ?? "VENTILACION";
      const n = (contadorPorItem.get(etiqueta) ?? 0) + 1;
      contadorPorItem.set(etiqueta, n);

      entradas.push({
        nombre: `${carpeta}/${etiqueta}_${n}${path.extname(archivo) || ".jpg"}`,
        contenido,
      });
      bytes += contenido.length;
    }
  }

  if (entradas.length === 0) {
    return new NextResponse(
      `No hay fotos ni videos para descargar con el filtro aplicado (${descripcion}).`,
      { status: 404 }
    );
  }

  // Nota dentro del ZIP: qué filtro se usó y, si se llegó al tope, qué quedó fuera.
  const leeme = [
    "Evidencia de verificación de apilamiento y ventilación de jabas",
    `Filtro aplicado: ${descripcion}`,
    `Verificaciones incluidas: ${new Set(entradas.map((e) => e.nombre.split("/")[0])).size}`,
    `Archivos incluidos: ${entradas.length}`,
    ...(topeAlcanzado
      ? [
          "",
          "ATENCIÓN: la descarga llegó al tope de tamaño y NO incluye todo.",
          `Quedaron fuera estas verificaciones: ${[...new Set(omitidos)].join(", ")}`,
          "Ajusta el rango de fechas o filtra por cliente para descargarlas.",
        ]
      : []),
  ].join("\n");
  entradas.unshift({ nombre: "LEEME.txt", contenido: Buffer.from(leeme, "utf8") });

  const zip = crearZip(entradas);
  const sufijo = nombreSeguro(descripcion).slice(0, 60) || "todo";

  return new NextResponse(new Uint8Array(zip), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="evidencia-apilamiento_${sufijo}.zip"`,
      "Content-Length": String(zip.length),
    },
  });
}
