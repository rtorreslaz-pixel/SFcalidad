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
  ReferenceLine,
} from "recharts";

type TendenciaPunto = {
  fecha: string;
  pctSeleccion: number;
  pctMerma: number;
  pctHematomas: number;
  pigmentacion: number | null;
  pctPododermatitis: number;
  pctRasgunos: number;
};
type RankingPunto = { codigo: string; valor: number; color: string };

export function TendenciaChart({
  data,
  objetivoSeleccion,
  yMax,
}: {
  data: TendenciaPunto[];
  objetivoSeleccion: number;
  yMax?: number;
}) {
  if (data.length === 0) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, yMax ?? "auto"]} allowDataOverflow={yMax != null} />
        <Tooltip formatter={(value) => `${value}%`} />
        <Legend />
        <ReferenceLine
          y={objetivoSeleccion}
          stroke="#059669"
          strokeDasharray="4 4"
          label={{ value: `Objetivo ${objetivoSeleccion}%`, fontSize: 10, position: "insideTopLeft" }}
        />
        <Line type="monotone" dataKey="pctSeleccion" name="% Selección" stroke="#059669" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function PigmentacionChart({
  data,
  objetivo,
}: {
  data: TendenciaPunto[];
  objetivo: { min: number; max: number };
}) {
  const puntos = data.filter((d) => d.pigmentacion != null);
  if (puntos.length === 0) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={puntos}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} domain={[0, 7]} />
        <Tooltip formatter={(value) => Number(value).toFixed(2)} />
        <Legend />
        <ReferenceLine
          y={objetivo.min}
          stroke="#059669"
          strokeDasharray="4 4"
          label={{ value: `Mín ${objetivo.min}`, fontSize: 10, position: "insideBottomLeft" }}
        />
        <ReferenceLine
          y={objetivo.max}
          stroke="#059669"
          strokeDasharray="4 4"
          label={{ value: `Máx ${objetivo.max}`, fontSize: 10, position: "insideTopLeft" }}
        />
        <Line type="monotone" dataKey="pigmentacion" name="Pigmentación (0-7)" stroke="#7c3aed" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function LesionChart({
  data,
  objetivoPodo,
  objetivoRasg,
  yMax,
}: {
  data: TendenciaPunto[];
  objetivoPodo: number;
  objetivoRasg: number;
  yMax?: number;
}) {
  if (data.length === 0) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, yMax ?? "auto"]} allowDataOverflow={yMax != null} />
        <Tooltip formatter={(value) => `${value}%`} />
        <Legend />
        <ReferenceLine
          y={objetivoPodo}
          stroke="#dc2626"
          strokeDasharray="4 4"
          label={{ value: `Objetivo Pododermatitis ${objetivoPodo}%`, fontSize: 10, position: "insideTopLeft" }}
        />
        <ReferenceLine
          y={objetivoRasg}
          stroke="#d97706"
          strokeDasharray="4 4"
          label={{ value: `Objetivo Rasguños ${objetivoRasg}%`, fontSize: 10, position: "insideBottomLeft" }}
        />
        <Line type="monotone" dataKey="pctPododermatitis" name="% Pododermatitis (G2)" stroke="#dc2626" strokeWidth={2} />
        <Line type="monotone" dataKey="pctRasgunos" name="% Rasguños (G2)" stroke="#d97706" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}

type ClientePunto = { cliente: string; pctSeleccion: number };
type DefectoPunto = { defecto: string; unidades: number };

export function ClienteChart({ data, objetivo }: { data: ClientePunto[]; objetivo: number }) {
  if (data.length === 0) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="cliente" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" height={70} />
        <YAxis tick={{ fontSize: 11 }} unit="%" />
        <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} />
        <ReferenceLine
          y={objetivo}
          stroke="#dc2626"
          strokeDasharray="4 4"
          label={{ value: `Objetivo ${objetivo}%`, fontSize: 10, position: "insideTopRight" }}
        />
        <Bar dataKey="pctSeleccion" name="% Selección" fill="#0b4ea2" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DefectoChart({ data }: { data: DefectoPunto[] }) {
  if (data.length === 0) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height={Math.max(240, data.length * 32)}>
      <BarChart data={data} layout="vertical" margin={{ left: 40 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="defecto" tick={{ fontSize: 11 }} width={140} />
        <Tooltip formatter={(value) => Number(value).toLocaleString("es-PE")} />
        <Bar dataKey="unidades" name="Unidades" fill="#0d9488" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RankingChart({
  data,
  name = "Merma (unidades)",
}: {
  data: RankingPunto[];
  name?: string;
}) {
  if (data.length === 0) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 36)}>
      <BarChart data={data} layout="vertical" margin={{ left: 16 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="codigo" tick={{ fontSize: 11 }} width={90} />
        <Tooltip formatter={(value) => Number(value).toLocaleString("es-PE")} />
        <Bar dataKey="valor" name={name}>
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
