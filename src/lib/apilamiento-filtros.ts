import type { Prisma } from "@/generated/prisma/client";

// Filtros del reporte de apilamiento. Viven aquí para que la pantalla, el CSV y la descarga de
// evidencia filtren exactamente igual: lo que se ve en la tabla es lo que se descarga.

export type FiltrosApilamiento = {
  clienteId: string;
  semaforo: string;
  desde: string;
  hasta: string;
};

export function leerFiltros(searchParams: URLSearchParams): FiltrosApilamiento {
  return {
    clienteId: searchParams.get("cliente") ?? "",
    semaforo: searchParams.get("semaforo") ?? "",
    desde: searchParams.get("desde") ?? "",
    hasta: searchParams.get("hasta") ?? "",
  };
}

export function construirWhere(f: FiltrosApilamiento): Prisma.ApilamientoRegistroWhereInput {
  const where: Prisma.ApilamientoRegistroWhereInput = {};
  if (f.clienteId) where.clienteId = f.clienteId;
  if (f.semaforo) where.semaforo = f.semaforo as Prisma.ApilamientoRegistroWhereInput["semaforo"];
  if (f.desde || f.hasta) {
    where.fechaEvaluacion = {};
    if (f.desde) where.fechaEvaluacion.gte = new Date(f.desde);
    if (f.hasta) where.fechaEvaluacion.lte = new Date(f.hasta + "T23:59:59");
  }
  return where;
}

/** Texto legible del filtro aplicado, para avisar qué incluye una descarga. */
export function describirFiltros(f: FiltrosApilamiento, nombreCliente?: string): string {
  const partes: string[] = [];
  if (f.clienteId) partes.push(`cliente: ${nombreCliente ?? f.clienteId}`);
  if (f.desde) partes.push(`desde ${f.desde}`);
  if (f.hasta) partes.push(`hasta ${f.hasta}`);
  if (f.semaforo) partes.push(`semáforo ${f.semaforo}`);
  return partes.length > 0 ? partes.join(" · ") : "sin filtros (todo)";
}

export function queryDeFiltros(f: FiltrosApilamiento): string {
  const qs = new URLSearchParams();
  if (f.clienteId) qs.set("cliente", f.clienteId);
  if (f.semaforo) qs.set("semaforo", f.semaforo);
  if (f.desde) qs.set("desde", f.desde);
  if (f.hasta) qs.set("hasta", f.hasta);
  return qs.toString();
}
