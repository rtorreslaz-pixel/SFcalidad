"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type TendenciaPunto = { fecha: string; pctSeleccion: number; pctMerma: number; pctHematomas: number };
type RankingPunto = { codigo: string; pctMerma: number; color: string };

export function TendenciaChart({ data }: { data: TendenciaPunto[] }) {
  if (data.length === 0) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} unit="%" />
        <Tooltip formatter={(value) => `${value}%`} />
        <Legend />
        <Line type="monotone" dataKey="pctSeleccion" name="% Selección" stroke="#059669" strokeWidth={2} />
        <Line type="monotone" dataKey="pctMerma" name="% Merma" stroke="#dc2626" strokeWidth={2} />
        <Line type="monotone" dataKey="pctHematomas" name="% Hematomas" stroke="#d97706" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function RankingChart({ data }: { data: RankingPunto[] }) {
  if (data.length === 0) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 36)}>
      <BarChart data={data} layout="vertical" margin={{ left: 16 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" tick={{ fontSize: 11 }} unit="%" />
        <YAxis type="category" dataKey="codigo" tick={{ fontSize: 11 }} width={90} />
        <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} />
        <Bar dataKey="pctMerma" name="% Merma">
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function EmptyState() {
  return (
    <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">
      Aún no hay datos suficientes para mostrar este gráfico.
    </div>
  );
}
