import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { tokenValido, APILAMIENTO_TOKEN_PARAM } from "@/lib/apilamiento-token";
import { checkLimit } from "@/lib/rate-limit";
import {
  calcularPorcentaje,
  calcularSemaforo,
  contarResultados,
  esHallazgoCritico,
  formatearCodigoRegistro,
  validarRegistro,
  type RespuestaInput,
} from "@/lib/apilamiento";
import type { ApilamientoResultado, SexoApilamiento, TipoVentilacion } from "@/generated/prisma/enums";

// Crea un registro de verificación de apilamiento y ventilación desde el enlace público.
// Valida las reglas RN-01..RN-08 en el servidor (el formulario también las aplica en pantalla,
// pero el servidor es la autoridad) y calcula cumplimiento y semáforo.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Placa peruana: AAA-000 o A0A-000.
const PLACA_RE = /^[A-Z][A-Z0-9][A-Z]-\d{3}$/;

type Body = {
  id?: string;
  fechaEvaluacion?: string;
  horaDescarga?: string;
  clienteId?: string;
  local?: string | null;
  verificadorNombre?: string;
  plantel?: string;
  galpon?: string | null;
  placaVehiculo?: string;
  cantidadJabas?: number;
  sexo?: string;
  densidadJaba?: number;
  tipoVentilacion?: string;
  cantidadVentiladores?: number | null;
  observacionesGenerales?: string | null;
  nombreResponsableLocal?: string | null;
  cargoResponsableLocal?: string | null;
  respuestas?: RespuestaInput[];
  medias?: { itemCodigo?: string | null; tipo: "FOTO" | "VIDEO"; path: string; bytes?: number }[];
};

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  if (!tokenValido(searchParams.get(APILAMIENTO_TOKEN_PARAM))) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "desconocida";
  if (checkLimit(`apilamiento-registro:${ip}`, 60, 60 * 60 * 1000).limited) {
    return NextResponse.json({ errores: ["Demasiados envíos seguidos. Espera unos minutos."] }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as Body | null;
  if (!body) return NextResponse.json({ errores: ["No se recibieron datos."] }, { status: 400 });

  const errores: string[] = [];
  const id = body.id && UUID_RE.test(body.id) ? body.id : null;
  if (!id) errores.push("Identificador de registro inválido.");

  // --- Cabecera ---
  const fechaEvaluacion = String(body.fechaEvaluacion ?? "");
  if (!fechaEvaluacion) errores.push("Falta la fecha de evaluación.");
  const horaDescarga = String(body.horaDescarga ?? "").trim();
  if (!/^\d{2}:\d{2}$/.test(horaDescarga)) errores.push("Falta la hora de descarga.");

  const clienteId = String(body.clienteId ?? "");
  const cliente = clienteId ? await prisma.cliente.findUnique({ where: { id: clienteId } }) : null;
  if (!cliente) errores.push("Selecciona un cliente válido.");

  const verificadorNombre = String(body.verificadorNombre ?? "").trim();
  if (verificadorNombre.length < 3) errores.push("Indica tu nombre como verificador.");

  const plantel = String(body.plantel ?? "").trim();
  if (!plantel) errores.push("Indica el plantel de origen.");

  const placaVehiculo = String(body.placaVehiculo ?? "").trim().toUpperCase();
  if (!PLACA_RE.test(placaVehiculo)) errores.push("La placa debe tener el formato AAA-000 o A0A-000.");

  const cantidadJabas = Number(body.cantidadJabas);
  if (!Number.isInteger(cantidadJabas) || cantidadJabas <= 0) errores.push("La cantidad de jabas debe ser mayor a 0.");

  const densidadJaba = Number(body.densidadJaba);
  if (!Number.isInteger(densidadJaba) || densidadJaba < 1 || densidadJaba > 20) {
    errores.push("La densidad por jaba debe estar entre 1 y 20 aves.");
  }

  const sexo = String(body.sexo ?? "") as SexoApilamiento;
  if (!["MACHO", "HEMBRA", "MIXTO"].includes(sexo)) errores.push("Selecciona el sexo del lote.");

  const tipoVentilacion = String(body.tipoVentilacion ?? "") as TipoVentilacion;
  if (!["MECANICA", "NATURAL"].includes(tipoVentilacion)) errores.push("Selecciona el tipo de ventilación.");

  const cantidadVentiladores =
    tipoVentilacion === "MECANICA" && body.cantidadVentiladores != null ? Number(body.cantidadVentiladores) : null;

  const respuestas = Array.isArray(body.respuestas) ? body.respuestas : [];

  const items = await prisma.apilamientoItem.findMany({ where: { activo: true }, orderBy: { orden: "asc" } });
  if (items.length === 0) {
    return NextResponse.json({ errores: ["El catálogo de ítems no está cargado. Avisa al administrador."] }, { status: 500 });
  }

  if (errores.length === 0) {
    errores.push(...validarRegistro({ respuestas, items, tipoVentilacion, cantidadVentiladores, fechaEvaluacion }));
  }

  if (errores.length > 0) return NextResponse.json({ errores }, { status: 400 });

  // --- Cálculo de cumplimiento (RN 4.1 / 4.2 / RN-07) ---
  const conteos = contarResultados(respuestas.map((r) => r.resultado as ApilamientoResultado));
  const hallazgoCritico = esHallazgoCritico(respuestas);
  const porcentaje = calcularPorcentaje(conteos);
  const semaforo = calcularSemaforo(porcentaje, hallazgoCritico);

  const fecha = new Date(fechaEvaluacion);

  // RN-08: cliente + fecha + placa no se repiten.
  const duplicado = await prisma.apilamientoRegistro.findFirst({
    where: { clienteId, fechaEvaluacion: fecha, placaVehiculo },
    select: { codigoRegistro: true },
  });
  if (duplicado) {
    return NextResponse.json(
      { errores: [`Ya existe el registro ${duplicado.codigoRegistro} para este cliente, fecha y placa.`] },
      { status: 409 }
    );
  }

  // Código APV-{año}-{secuencia}: se reintenta si dos verificadores envían a la vez.
  const anio = fecha.getFullYear();
  const desde = new Date(anio, 0, 1);
  const hasta = new Date(anio + 1, 0, 1);

  const mediasValidas = (body.medias ?? []).filter((m) => typeof m.path === "string" && m.path.includes(`/${id}/`));

  for (let intento = 0; intento < 5; intento++) {
    const usados = await prisma.apilamientoRegistro.count({
      where: { fechaEvaluacion: { gte: desde, lt: hasta } },
    });
    const codigoRegistro = formatearCodigoRegistro(anio, usados + 1 + intento);

    try {
      const creado = await prisma.$transaction(async (tx) => {
        const registro = await tx.apilamientoRegistro.create({
          data: {
            id: id!,
            codigoRegistro,
            fechaEvaluacion: fecha,
            horaDescarga,
            clienteId,
            local: body.local?.trim() || null,
            verificadorNombre,
            plantel,
            galpon: body.galpon?.trim() || null,
            placaVehiculo,
            cantidadJabas,
            sexo,
            densidadJaba,
            tipoVentilacion,
            cantidadVentiladores,
            itemsConformes: conteos.conformes,
            itemsNoConformes: conteos.noConformes,
            itemsNa: conteos.na,
            itemsVn: conteos.vn,
            porcentajeCumplimiento: porcentaje,
            semaforo,
            hallazgoCritico,
            estado: "FINALIZADO",
            observacionesGenerales: body.observacionesGenerales?.trim() || null,
            nombreResponsableLocal: body.nombreResponsableLocal?.trim() || null,
            cargoResponsableLocal: body.cargoResponsableLocal?.trim() || null,
          },
        });

        const detallePorItem = new Map<string, string>();
        for (const r of respuestas) {
          const detalle = await tx.apilamientoDetalle.create({
            data: {
              registroId: registro.id,
              itemCodigo: r.itemCodigo,
              resultado: r.resultado as ApilamientoResultado,
              observacion: r.observacion?.trim() || null,
            },
          });
          detallePorItem.set(r.itemCodigo, detalle.id);
        }

        for (const m of mediasValidas) {
          await tx.apilamientoMedia.create({
            data: {
              registroId: registro.id,
              detalleId: m.itemCodigo ? detallePorItem.get(m.itemCodigo) ?? null : null,
              itemCodigo: m.itemCodigo || null,
              tipo: m.tipo === "VIDEO" ? "VIDEO" : "FOTO",
              path: m.path,
              bytes: m.bytes ?? null,
            },
          });
        }

        return registro;
      });

      return NextResponse.json({
        ok: true,
        codigoRegistro: creado.codigoRegistro,
        porcentajeCumplimiento: porcentaje,
        semaforo,
        hallazgoCritico,
      });
    } catch (e) {
      const mensaje = e instanceof Error ? e.message : String(e);
      // Choque de código (dos envíos simultáneos): se reintenta con la siguiente secuencia.
      if (mensaje.includes("codigoRegistro") && intento < 4) continue;
      if (mensaje.includes("clienteId") || mensaje.includes("Unique")) {
        return NextResponse.json(
          { errores: ["Ya existe un registro para este cliente, fecha y placa."] },
          { status: 409 }
        );
      }
      return NextResponse.json({ errores: ["No se pudo guardar el registro. Intenta de nuevo."] }, { status: 500 });
    }
  }

  return NextResponse.json({ errores: ["No se pudo generar el código del registro. Intenta de nuevo."] }, { status: 500 });
}
