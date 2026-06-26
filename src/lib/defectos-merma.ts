// Nombres de TipoDefecto que el reporte diario de calidad clasifica como "merma" (paso 7
// del wizard de evaluación) en vez de "selección". Compartido por todas las páginas que
// calculan % merma sobre Inspeccion.defectos, para que la definición no se desincronice
// entre ellas.
export const NOMBRES_MERMA_PASO7 = [
  "Alas Grado 1°", "Alas Grado 2°", "Alas Grado 3°", "Alas Rota",
  "Pierna Grado 1°", "Pierna Grado 2°", "Pierna Grado 3°", "Pierna Rota",
  "Alas Mutiladas", "Piernas Mutiladas",
];

export function esDefectoMerma(nombreTipoDefecto: string): boolean {
  return NOMBRES_MERMA_PASO7.includes(nombreTipoDefecto);
}
