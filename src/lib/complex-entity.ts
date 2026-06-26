import type { CategoriaAve } from "@/generated/prisma/enums";

// Misma idea que buildComplexEntity en el wizard de evaluación (Plantel-Campaña-Galpón-
// Sexo-Corral), pero con CategoriaAve (MACHO/HEMBRA/MEDIANO) en vez de SexoAve (MACHO/
// HEMBRA) -- MEDIANO no tiene equivalente en calidad, por lo que esos registros de
// preventa no van a cruzar contra ninguna Inspeccion.complex, lo cual es esperado.
const CATEGORIA_ABREV: Record<CategoriaAve, string> = {
  MACHO: "M",
  HEMBRA: "H",
  MEDIANO: "MD",
};

export function buildComplexEntity(parts: {
  plantelCodigo: string | null;
  campania: string | null;
  galpon: string | null;
  categoria: CategoriaAve | null;
  corral: string | null;
}): string | null {
  const { plantelCodigo, campania, galpon, categoria, corral } = parts;
  const categoriaAbrev = categoria ? CATEGORIA_ABREV[categoria] : "";
  const piezas = [plantelCodigo ?? "", campania ?? "", galpon ?? "", categoriaAbrev, corral ?? ""];
  if (piezas.every((p) => !p)) return null;
  return piezas.join("-");
}
