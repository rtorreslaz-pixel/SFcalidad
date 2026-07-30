import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { resolveExportUser, csvResponse } from "@/lib/export-csv";
import { RESULTADO_LABEL } from "@/lib/apilamiento";
import type { Prisma } from "@/generated/prisma/client";

// CSV del módulo de apilamiento y ventilación: una fila por ítem evaluado, con los datos de la
// cabecera repetidos, la observación, la evidencia adjunta y la acción correctiva del ítem.

export async function GET(request: NextRequest) {
  await resolveExportUser(request);
  const { searchParams } = new URL(request.url);

  const where: Prisma.ApilamientoRegistroWhereInput = {};
  const clienteId = searchParams.get("cliente");
  const semaforo = searchParams.get("semaforo");
  const desde = searchParams.get("desde");
  const hasta = searchParams.get("hasta");
  if (clienteId) where.clienteId = clienteId;
  if (semaforo) where.semaforo = semaforo as Prisma.ApilamientoRegistroWhereInput["semaforo"];
  if (desde || hasta) {
    where.fechaEvaluacion = {};
    if (desde) where.fechaEvaluacion.gte = new Date(desde);
    if (hasta) where.fechaEvaluacion.lte = new Date(hasta + "T23:59:59");
  }

  const registros = await prisma.apilamientoRegistro.findMany({
    where,
    orderBy: { fechaEvaluacion: "desc" },
    include: {
      cliente: { select: { nombre: true } },
      detalles: { include: { item: true }, orderBy: { item: { orden: "asc" } } },
      medias: true,
    },
  });

  const headers = [
    "CÓDIGO",
    "FECHA",
    "CLIENTE",
    "LOCAL",
    "VERIFICADOR",
    "TIPO VENTILACIÓN",
    "N° VENTILADORES",
    "% CUMPLIMIENTO",
    "SEMÁFORO",
    "HALLAZGO CRÍTICO",
    "ÍTEM",
    "BLOQUE",
    "REF. IICYB003",
    "DESCRIPCIÓN ÍTEM",
    "RESULTADO",
    "OBSERVACIÓN",
    "FOTOS",
    "VIDEOS",
    "FOTOS VENTILACIÓN",
    "VIDEOS VENTILACIÓN",
    "OBSERVACIONES GENERALES",
  ];

  const rows: (string | number)[][] = [headers];
  for (const r of registros) {
    // Evidencia general del local (ventilación): no pertenece a un ítem, se repite por fila.
    const generales = r.medias.filter((m) => m.itemCodigo === null);
    for (const d of r.detalles) {
      const medias = r.medias.filter((m) => m.itemCodigo === d.itemCodigo);
      rows.push([
        r.codigoRegistro,
        r.fechaEvaluacion.toISOString().slice(0, 10),
        r.cliente.nombre,
        r.local,
        r.verificadorNombre,
        r.tipoVentilacion,
        r.cantidadVentiladores ?? "",
        r.porcentajeCumplimiento != null ? r.porcentajeCumplimiento.toFixed(2) : "",
        r.semaforo,
        r.hallazgoCritico ? "Sí" : "No",
        d.itemCodigo,
        d.item.bloque,
        d.item.referenciaInstructivo ?? "",
        d.item.descripcion,
        RESULTADO_LABEL[d.resultado],
        d.observacion ?? "",
        medias.filter((m) => m.tipo === "FOTO").length,
        medias.filter((m) => m.tipo === "VIDEO").length,
        generales.filter((m) => m.tipo === "FOTO").length,
        generales.filter((m) => m.tipo === "VIDEO").length,
        r.observacionesGenerales ?? "",
      ]);
    }
  }

  return csvResponse(rows, "apilamiento-ventilacion");
}
