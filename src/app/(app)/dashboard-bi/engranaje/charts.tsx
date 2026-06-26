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

export type PuntoComparativo = {
  metrica: string;
  granja: number | null;
  cliente: number | null;
};

export function ComparativoCalidadChart({ data }: { data: PuntoComparativo[] }) {
  const hayDatos = data.some((d) => d.granja != null || d.cliente != null);
  if (!hayDatos) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="metrica" tick={{ fontSize: 11 }} />
        <YAxis unit="%" tick={{ fontSize: 11 }} />
        <Tooltip content={<ComparativoTooltip />} />
        <Legend />
        <Bar dataKey="granja" name="Granja" fill="#0d9488" radius={[4, 4, 0, 0]} />
        <Bar dataKey="cliente" name="Cliente" fill="#2563eb" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function ComparativoTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md bg-white p-2 text-xs shadow ring-1 ring-slate-200">
      <p className="font-semibold text-slate-900">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value.toFixed(2)}%
        </p>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">
      Aún no hay lotes cruzados con calidad evaluada en granja y en cliente para comparar.
    </div>
  );
}
