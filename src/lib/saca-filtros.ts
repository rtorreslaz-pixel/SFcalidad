import type { Prisma } from "@/generated/prisma/client";

// Filtros del reporte de saca. Igual que en apilamiento, viven aquí para que la pantalla y el CSV
// filtren exactamente igual: lo que se ve en la tabla es lo que se descarga.

export type FiltrosSaca = {
  desde: string;
  hasta: string;
  plantelId: string;
};

export function leerFiltrosSaca(params: {
  desde?: string;
  hasta?: string;
  plantel?: string;
}): FiltrosSaca {
  return {
    desde: params.desde ?? "",
    hasta: params.hasta ?? "",
    plantelId: params.plantel ?? "",
  };
}

export function construirWhereSaca(f: FiltrosSaca): Prisma.SacaMuestreoWhereInput {
  const where: Prisma.SacaMuestreoWhereInput = {};
  if (f.plantelId) where.plantelId = f.plantelId;
  if (f.desde || f.hasta) {
    where.fecha = {};
    // La fecha de saca se guarda como fecha/hora: el "hasta" incluye todo el día.
    if (f.desde) where.fecha.gte = new Date(f.desde);
    if (f.hasta) where.fecha.lte = new Date(f.hasta + "T23:59:59");
  }
  return where;
}

/** Texto legible del filtro aplicado, para avisar qué incluye la descarga. */
export function describirFiltrosSaca(f: FiltrosSaca, nombrePlantel?: string): string {
  const partes: string[] = [];
  if (f.desde) partes.push(`desde ${f.desde}`);
  if (f.hasta) partes.push(`hasta ${f.hasta}`);
  if (f.plantelId) partes.push(`plantel: ${nombrePlantel ?? f.plantelId}`);
  return partes.length > 0 ? partes.join(" · ") : "sin filtros (todo)";
}

export function queryDeFiltrosSaca(f: FiltrosSaca): string {
  const qs = new URLSearchParams();
  if (f.desde) qs.set("desde", f.desde);
  if (f.hasta) qs.set("hasta", f.hasta);
  if (f.plantelId) qs.set("plantel", f.plantelId);
  return qs.toString();
}
