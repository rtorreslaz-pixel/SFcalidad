export function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7; // lunes=0 ... domingo=6
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const diff = d.getTime() - firstThursday.getTime();
  return 1 + Math.round(diff / (7 * 24 * 3600 * 1000));
}

export const META_SELECCION_DEFAULT = 0.6;

export function calcularPorcentajeSeleccion(unidadesSeleccion: number, cantidad: number): number {
  if (!cantidad) return 0;
  return (unidadesSeleccion / cantidad) * 100;
}
