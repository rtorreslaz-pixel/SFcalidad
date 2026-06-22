import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getISOWeek } from "@/lib/calc";

type DefectoIn = { nombre: string; unidades: number; kg: number };

type RowIn = {
  meta: number;
  fecha: string;
  campania: string | null;
  nroGuia: string | null;
  cliente: string;
  plantelCodigo: string;
  plantelMeta: {
    tipoPlantel: string | null;
    subZona: string | null;
    zonaEvaluacion: string | null;
    zona: string | null;
  };
  galpon: string | null;
  sexo: "MACHO" | "HEMBRA" | null;
  cantidad: number;
  promVivo: number | null;
  promBeneficiado: number | null;
  defectos: DefectoIn[];
};

// Categorías que no existían en el catálogo (sin registros hasta importar el histórico real).
const TIPO_DEFECTO_DEFAULTS: Record<string, { categoria: string; orden: number }> = {
  Mutilados: { categoria: "General", orden: 23 },
  "Alas Mutiladas": { categoria: "Alas", orden: 24 },
  "Piernas Mutiladas": { categoria: "Pierna", orden: 25 },
};

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPERVISOR") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json();

  if (body.action === "wipe") {
    const result = await prisma.inspeccion.deleteMany({});
    return NextResponse.json({ deleted: result.count });
  }

  if (body.action !== "import" || !Array.isArray(body.rows)) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const rows: RowIn[] = body.rows;

  const [clientes, planteles, tipos] = await Promise.all([
    prisma.cliente.findMany(),
    prisma.plantel.findMany(),
    prisma.tipoDefecto.findMany(),
  ]);

  const clienteIdByNombre = new Map(clientes.map((c) => [c.nombre, c.id]));
  const plantelIdByCodigo = new Map(planteles.map((p) => [p.codigo, p.id]));
  const tipoIdByNombre = new Map(tipos.map((t) => [t.nombre, t.id]));

  let created = 0;
  const errors: { index: number; error: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const clienteId = clienteIdByNombre.get(row.cliente);
      if (!clienteId) throw new Error(`Cliente no encontrado: ${row.cliente}`);

      let plantelId = plantelIdByCodigo.get(row.plantelCodigo);
      if (!plantelId) {
        const nuevoPlantel = await prisma.plantel.create({
          data: {
            codigo: row.plantelCodigo,
            zona: row.plantelMeta.zona,
            subZona: row.plantelMeta.subZona,
            tipoPlantel: row.plantelMeta.tipoPlantel,
            zonaEvaluacion: row.plantelMeta.zonaEvaluacion,
          },
        });
        plantelId = nuevoPlantel.id;
        plantelIdByCodigo.set(row.plantelCodigo, plantelId);
      }

      const defectosData: { tipoDefectoId: string; unidades: number; kg: number }[] = [];
      for (const d of row.defectos) {
        let tipoDefectoId = tipoIdByNombre.get(d.nombre);
        if (!tipoDefectoId) {
          const defaults = TIPO_DEFECTO_DEFAULTS[d.nombre] ?? { categoria: "General", orden: 99 };
          const nuevoTipo = await prisma.tipoDefecto.create({
            data: { nombre: d.nombre, categoria: defaults.categoria, orden: defaults.orden },
          });
          tipoDefectoId = nuevoTipo.id;
          tipoIdByNombre.set(d.nombre, tipoDefectoId);
        }
        defectosData.push({ tipoDefectoId, unidades: d.unidades, kg: d.kg });
      }

      const fecha = new Date(row.fecha);

      await prisma.inspeccion.create({
        data: {
          fecha,
          anio: fecha.getFullYear(),
          mes: fecha.getMonth() + 1,
          semana: getISOWeek(fecha),
          campania: row.campania,
          nroGuia: row.nroGuia,
          clienteId,
          plantelId,
          galpon: row.galpon,
          sexo: row.sexo,
          cantidad: row.cantidad,
          metaPorcentaje: row.meta,
          promVivo: row.promVivo,
          promBeneficiado: row.promBeneficiado,
          defectos: { create: defectosData },
        },
      });
      created++;
    } catch (e) {
      errors.push({ index: i, error: e instanceof Error ? e.message : String(e) });
    }
  }

  return NextResponse.json({ created, errors });
}
