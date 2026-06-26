"use client";

import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export type PuntoEngranaje = {
  pesoPromedioGramos: number;
  pctMerma: number;
  categoria: string;
  etiqueta: string;
};

const COLOR_POR_CATEGORIA: Record<string, string> = {
  MACHO: "#2563eb",
  HEMBRA: "#db2777",
  MEDIANO: "#7c3aed",
};

export function EngranajeScatterChart({ data }: { data: PuntoEngranaje[] }) {
  if (data.length === 0) return <EmptyState />;
  const categorias = Array.from(new Set(data.map((d) => d.categoria)));
  return (
    <ResponsiveContainer width="100%" height={320}>
      <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" dataKey="pesoPromedioGramos" name="Peso promedio" unit=" g" tick={{ fontSize: 11 }} />
        <YAxis type="number" dataKey="pctMerma" name="% Merma" unit="%" tick={{ fontSize: 11 }} />
        <Tooltip cursor={{ strokeDasharray: "3 3" }} content={<EngranajeTooltip />} />
        <Legend />
        {categorias.map((cat) => (
          <Scatter key={cat} name={cat} data={data.filter((d) => d.categoria === cat)} fill={COLOR_POR_CATEGORIA[cat] ?? "#64748b"} />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
}

function EngranajeTooltip({ active, payload }: { active?: boolean; payload?: { payload: PuntoEngranaje }[] }) {
  if (!active || !payload?.length) return null;
  const punto = payload[0].payload;
  return (
    <div className="rounded-md bg-white p-2 text-xs shadow ring-1 ring-slate-200">
      <p className="font-semibold text-slate-900">{punto.etiqueta}</p>
      <p>Peso promedio: {punto.pesoPromedioGramos} g</p>
      <p>% Merma: {punto.pctMerma}%</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">
      Aún no hay lotes con peso y calidad cruzados para graficar.
    </div>
  );
}
