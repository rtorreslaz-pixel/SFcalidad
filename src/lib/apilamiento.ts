import type { ApilamientoResultado, SemaforoApilamiento, TipoVentilacion } from "@/generated/prisma/enums";

// Reglas de negocio del módulo de apilamiento y ventilación (instructivo IICYB003).
// Todo el cálculo vive aquí para que la API pública, el reporte y el CSV coincidan.

/** Ítems del ventilador: se resuelven como VN cuando el local usa ventilación natural. */
export const ITEMS_VENTILADOR = ["APV-05", "APV-06", "APV-07"] as const;

/** Ítem de resultado del bloque de ventilación: SIEMPRE se evalúa C o NC (RN-01). */
export const ITEM_CONFORT = "APV-08";

/** Ítem del bloque de descarga: solo admite conforme o no conforme. */
export const ITEM_DESCARGA = "APV-01";

export const TOTAL_ITEMS = 8;

export const UMBRAL_VERDE = 95;
export const UMBRAL_AMBAR = 85;

export type Conteos = {
  conformes: number;
  noConformes: number;
  na: number;
  vn: number;
};

export function contarResultados(resultados: ApilamientoResultado[]): Conteos {
  return {
    conformes: resultados.filter((r) => r === "C").length,
    noConformes: resultados.filter((r) => r === "NC").length,
    na: resultados.filter((r) => r === "NA").length,
    vn: resultados.filter((r) => r === "VN").length,
  };
}

/**
 * % de cumplimiento = C / (C + NC) * 100. Los NA y VN se excluyen del denominador, así que
 * un local con ventilación natural se evalúa sobre 5 ítems y uno con mecánica sobre 8.
 * Devuelve null si no queda ningún ítem evaluable.
 */
export function calcularPorcentaje(conteos: Conteos): number | null {
  const evaluables = conteos.conformes + conteos.noConformes;
  if (evaluables === 0) return null;
  return Number(((conteos.conformes / evaluables) * 100).toFixed(2));
}

/**
 * Semáforo por umbrales, con la excepción del RN-07: un NC en APV-08 (confort del ave)
 * fuerza ROJO sin importar el porcentaje, porque implica riesgo de asfixia y mortalidad.
 */
export function calcularSemaforo(porcentaje: number | null, hallazgoCritico: boolean): SemaforoApilamiento {
  if (hallazgoCritico) return "ROJO";
  if (porcentaje === null) return "NA";
  if (porcentaje >= UMBRAL_VERDE) return "VERDE";
  if (porcentaje >= UMBRAL_AMBAR) return "AMBAR";
  return "ROJO";
}

/** RN-07: hallazgo crítico si el ítem de confort del ave quedó no conforme. */
export function esHallazgoCritico(respuestas: { itemCodigo: string; resultado: ApilamientoResultado }[]): boolean {
  return respuestas.some((r) => r.itemCodigo === ITEM_CONFORT && r.resultado === "NC");
}

/** Resultados permitidos para un ítem según el catálogo y el tipo de ventilación del local. */
export function resultadosPermitidos(
  item: { codigo: string; permiteNa: boolean; permiteVn: boolean },
  tipoVentilacion: TipoVentilacion | null
): ApilamientoResultado[] {
  const permitidos: ApilamientoResultado[] = ["C", "NC"];
  // RN-01/RN-02: VN solo existe en los ítems del ventilador y solo con ventilación natural.
  if (item.permiteVn && tipoVentilacion === "NATURAL") permitidos.push("VN");
  if (item.permiteNa) permitidos.push("NA");
  return permitidos;
}

export type RespuestaInput = {
  itemCodigo: string;
  resultado: ApilamientoResultado;
  observacion?: string | null;
};

/**
 * Valida un registro completo antes de guardarlo. Devuelve la lista de errores en castellano
 * (vacía si todo está bien) para mostrarlos tal cual en el formulario.
 *
 * El verificador solo levanta información: la observación es OPCIONAL en todos los casos y no
 * se piden acciones correctivas. Lo único que se exige es que los ítems estén respondidos con
 * un resultado válido para el tipo de ventilación del local.
 */
export function validarRegistro(input: {
  respuestas: RespuestaInput[];
  items: { codigo: string; permiteNa: boolean; permiteVn: boolean }[];
  tipoVentilacion: TipoVentilacion;
  cantidadVentiladores: number | null;
  fechaEvaluacion: string;
}): string[] {
  const errores: string[] = [];
  const { respuestas, items, tipoVentilacion, cantidadVentiladores, fechaEvaluacion } = input;

  // RN-05: los 8 ítems deben tener resultado.
  if (respuestas.length !== items.length) {
    errores.push(`Faltan ítems por responder (${respuestas.length} de ${items.length}).`);
  }
  const codigosRespondidos = new Set(respuestas.map((r) => r.itemCodigo));
  for (const item of items) {
    if (!codigosRespondidos.has(item.codigo)) errores.push(`El ítem ${item.codigo} no tiene resultado.`);
  }

  // RN-02: con ventilación mecánica hace falta al menos un ventilador.
  if (tipoVentilacion === "MECANICA" && (cantidadVentiladores == null || cantidadVentiladores < 1)) {
    errores.push("Con ventilación mecánica debes indicar la cantidad de ventiladores (mínimo 1).");
  }

  // No se admite fecha futura.
  const hoy = new Date();
  hoy.setHours(23, 59, 59, 999);
  if (new Date(fechaEvaluacion) > hoy) errores.push("La fecha de evaluación no puede ser futura.");

  const itemsPorCodigo = new Map(items.map((i) => [i.codigo, i]));
  for (const r of respuestas) {
    const item = itemsPorCodigo.get(r.itemCodigo);
    if (!item) {
      errores.push(`El ítem ${r.itemCodigo} no existe en el catálogo.`);
      continue;
    }
    // RN-01/RN-02: el resultado debe estar permitido para ese ítem y tipo de ventilación.
    if (!resultadosPermitidos(item, tipoVentilacion).includes(r.resultado)) {
      errores.push(`El resultado ${r.resultado} no es válido para el ítem ${r.itemCodigo}.`);
    }
  }

  return errores;
}

/** Genera el código APV-{AAAA}-{secuencia 5 dígitos}. */
export function formatearCodigoRegistro(anio: number, secuencia: number): string {
  return `APV-${anio}-${String(secuencia).padStart(5, "0")}`;
}

export const SEMAFORO_LABEL: Record<SemaforoApilamiento, string> = {
  VERDE: "🟢 Verde",
  AMBAR: "🟡 Ámbar",
  ROJO: "🔴 Rojo",
  NA: "— Sin evaluar",
};

export const RESULTADO_LABEL: Record<ApilamientoResultado, string> = {
  C: "Conforme",
  NC: "No conforme",
  NA: "No aplica",
  VN: "Ventilación natural",
};
