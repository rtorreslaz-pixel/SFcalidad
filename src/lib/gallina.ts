import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";

// Consulta y filtros del módulo GALLINA. Viven aquí para que la pantalla y la descarga
// muestren exactamente lo mismo: mismos filtros, misma restricción por verificador.

export type FiltrosGallina = {
  desde: string | null;
  hasta: string | null;
  cliente: string | null;
  material: string | null;
  guia: string | null;
};

export function leerFiltrosGallina(sp: {
  desde?: string;
  hasta?: string;
  cliente?: string;
  material?: string;
  guia?: string;
}): FiltrosGallina {
  const limpia = (v?: string) => (v && v.trim().length > 0 ? v.trim() : null);
  return {
    desde: limpia(sp.desde),
    hasta: limpia(sp.hasta),
    cliente: limpia(sp.cliente),
    material: limpia(sp.material),
    guia: limpia(sp.guia),
  };
}

export function queryDeFiltrosGallina(f: FiltrosGallina): string {
  const p = new URLSearchParams();
  if (f.desde) p.set("desde", f.desde);
  if (f.hasta) p.set("hasta", f.hasta);
  if (f.cliente) p.set("cliente", f.cliente);
  if (f.material) p.set("material", f.material);
  if (f.guia) p.set("guia", f.guia);
  const s = p.toString();
  return s ? "?" + s : "";
}

export function construirWhereGallina(f: FiltrosGallina): Record<string, unknown> {
  const where: Record<string, unknown> = {};
  if (f.desde || f.hasta) {
    const fecha: Record<string, Date> = {};
    if (f.desde) fecha.gte = new Date(f.desde + "T00:00:00");
    // El "hasta" es inclusivo: se compara contra el final del día, no contra su medianoche.
    if (f.hasta) fecha.lte = new Date(f.hasta + "T23:59:59.999");
    where.fecha = fecha;
  }
  if (f.cliente) where.clienteId = f.cliente;
  if (f.material) where.materialId = f.material;
  if (f.guia) where.guiaReferencia = { contains: f.guia };
  return where;
}

export type DespachoGallina = Awaited<ReturnType<typeof construirDespachos>>[number];

export async function construirDespachos(user: SessionUser | null, f: FiltrosGallina) {
  const where = construirWhereGallina(f);
  // Un verificador solo ve lo suyo; supervisor, jefe y comercial ven todo.
  if (user?.role === "VERIFICADOR") where.verificadorId = user.id;

  return prisma.gallinaDespacho.findMany({
    where,
    orderBy: { fecha: "desc" },
    take: 300,
    include: {
      cliente: { select: { nombre: true } },
      material: { select: { codigo: true, descripcion: true } },
      verificador: { select: { nombre: true } },
      pesadas: { orderBy: { fechaHora: "asc" } },
    },
  });
}

/** Totales de un despacho: lo que se mira para saber si el camión cuadra. */
export function totalesDespacho(d: DespachoGallina) {
  const jabas = d.pesadas.reduce((a, p) => a + p.jabas, 0);
  const unidades = d.pesadas.reduce((a, p) => a + p.unidades, 0);
  const destare = d.pesadas.reduce((a, p) => a + p.pesoDestareGramos, 0);
  const conAve = d.pesadas.reduce((a, p) => a + p.pesoConAveGramos, 0);
  const neto = d.pesadas.reduce((a, p) => a + p.pesoNetoGramos, 0);
  // Si el verificador corrigió la densidad a mitad del camión, se listan todas las que
  // se usaron en vez de una sola, que sería mentira.
  const densidades = [...new Set(d.pesadas.map((p) => p.densidad))].sort((a, b) => a - b);
  return {
    pesadas: d.pesadas.length,
    densidades: densidades.join(" / "),
    jabas,
    unidades,
    destare,
    conAve,
    neto,
    // Promedio ponderado por ave del despacho completo, no el promedio de los promedios.
    promedio: unidades > 0 ? neto / unidades : null,
  };
}

/**
 * Filas planas para Excel/CSV, con el formato del archivo de referencia: una fila por
 * pesada, repitiendo los datos del despacho (cliente, fecha, material, guía, placa).
 */
export function filasGallina(despachos: DespachoGallina[]): (string | number)[][] {
  const rows: (string | number)[][] = [[
    "CLIENTE", "FECHA", "MATERIAL", "DESCRIPCIÓN", "JABAS", "DENSIDAD", "UNIDADES",
    "GUÍA DE REFERENCIA", "PLACA", "PESO DESTARE (kg)", "PESO CON AVE (kg)", "NETO (kg)",
    "PROMEDIO (g)", "N° PESADA", "VERIFICADOR",
  ]];
  const kg = (g: number) => Number((g / 1000).toFixed(3));
  for (const d of despachos) {
    d.pesadas.forEach((p, i) => {
      rows.push([
        d.cliente.nombre,
        d.fecha.toISOString().slice(0, 10),
        d.material.codigo,
        d.material.descripcion,
        p.jabas,
        p.densidad,
        p.unidades,
        d.guiaReferencia,
        d.placa,
        kg(p.pesoDestareGramos),
        kg(p.pesoConAveGramos),
        kg(p.pesoNetoGramos),
        Math.round(p.promedioGramos),
        i + 1,
        d.verificador.nombre,
      ]);
    });
  }
  return rows;
}

/** Hoja extra: un renglón por despacho, con sus totales. */
export function filasResumenDespachos(despachos: DespachoGallina[]): (string | number)[][] {
  const rows: (string | number)[][] = [[
    "CLIENTE", "FECHA", "MATERIAL", "DESCRIPCIÓN", "GUÍA DE REFERENCIA", "PLACA",
    "PESADAS", "JABAS", "DENSIDAD", "UNIDADES", "PESO DESTARE (kg)", "PESO CON AVE (kg)",
    "NETO (kg)", "PROMEDIO (g)", "VERIFICADOR",
  ]];
  const kg = (g: number) => Number((g / 1000).toFixed(3));
  for (const d of despachos) {
    const t = totalesDespacho(d);
    rows.push([
      d.cliente.nombre,
      d.fecha.toISOString().slice(0, 10),
      d.material.codigo,
      d.material.descripcion,
      d.guiaReferencia,
      d.placa,
      t.pesadas,
      t.jabas,
      t.densidades,
      t.unidades,
      kg(t.destare),
      kg(t.conAve),
      kg(t.neto),
      t.promedio == null ? "" : Math.round(t.promedio),
      d.verificador.nombre,
    ]);
  }
  return rows;
}
