import { timingSafeEqual } from "crypto";

// El registro de apilamiento se llena desde un enlace sin sesión (los verificadores lo abren
// en el local del cliente), así que el enlace lleva un token secreto: sin token válido el
// módulo público no existe (404). El token vive en la variable de entorno APILAMIENTO_TOKEN;
// si no está definida, el formulario público queda deshabilitado -- nunca abierto por defecto.

export const APILAMIENTO_TOKEN_PARAM = "k";

function comparar(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** true si el token recibido coincide con el configurado. Sin variable configurada: false. */
export function tokenValido(token: string | null | undefined): boolean {
  const esperado = process.env.APILAMIENTO_TOKEN;
  if (!esperado || esperado.length < 8) return false; // módulo público deshabilitado
  if (!token) return false;
  return comparar(token, esperado);
}

/** El enlace que se comparte a los verificadores (solo para mostrarlo al supervisor). */
export function enlacePublico(baseUrl: string): string | null {
  const token = process.env.APILAMIENTO_TOKEN;
  if (!token) return null;
  return `${baseUrl.replace(/\/$/, "")}/apilamiento?${APILAMIENTO_TOKEN_PARAM}=${token}`;
}
