"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type CorralPunto = {
  label: string;
  MACHO: number | null;
  HEMBRA: number | null;
  MEDIANO: number | null;
};

export default function PreventaCharts({ porCorral }: { porCorral: CorralPunto[] }) {
  return (
    <ChartCard title="Peso promedio por corral y categoría (g)">
      {porCorral.length === 0 ? (
        <EmptyState />
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={porCorral}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" height={70} />
            <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
            <Tooltip />
            <Legend />
            <Bar dataKey="MACHO" name="Macho" fill="#0d9488" />
            <Bar dataKey="HEMBRA" name="Hembra" fill="#d97706" />
            <Bar dataKey="MEDIANO" name="Mediano" fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <h2 className="mb-3 font-semibold text-slate-900">{title}</h2>
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-[320px] items-center justify-center text-sm text-slate-400">
      Aún no hay datos suficientes para mostrar este gráfico.
    </div>
  );
}
