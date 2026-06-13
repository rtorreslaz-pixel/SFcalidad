"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type TendenciaPunto = { label: string; porcentaje: number; meta: number };
type ClientePunto = { cliente: string; porcentaje: number; meta: number };
type DefectoPunto = { defecto: string; unidades: number };

export default function DashboardCharts({
  tendenciaSemanal,
  porCliente,
  porDefecto,
}: {
  tendenciaSemanal: TendenciaPunto[];
  porCliente: ClientePunto[];
  porDefecto: DefectoPunto[];
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <ChartCard title="% Selección semanal vs meta">
        {tendenciaSemanal.length === 0 ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={tendenciaSemanal}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="porcentaje" name="% Selección" stroke="#059669" strokeWidth={2} />
              <Line type="monotone" dataKey="meta" name="Meta" stroke="#dc2626" strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="% Selección por cliente">
        {porCliente.length === 0 ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={porCliente}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="cliente" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" height={70} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="porcentaje" name="% Selección" fill="#059669" />
              <Line type="monotone" dataKey="meta" name="Meta" stroke="#dc2626" strokeDasharray="4 4" dot={false} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Top 10 defectos (unidades)" full>
        {porDefecto.length === 0 ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={porDefecto} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="defecto" tick={{ fontSize: 11 }} width={140} />
              <Tooltip />
              <Bar dataKey="unidades" name="Unidades" fill="#0d9488" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children, full }: { title: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 ${full ? "lg:col-span-2" : ""}`}>
      <h2 className="mb-3 font-semibold text-slate-900">{title}</h2>
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-[280px] items-center justify-center text-sm text-slate-400">
      Aún no hay datos suficientes para mostrar este gráfico.
    </div>
  );
}
