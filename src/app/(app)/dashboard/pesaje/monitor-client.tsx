"use client";

import { useEffect, useState } from "react";

type Balanza = {
  verificador: string;
  pesoGramos: number;
  campania: string | null;
  plantelCodigo: string | null;
  galpon: string | null;
  corral: string | null;
  categoria: string | null;
  complex: string | null;
  avesLote: number;
  pesoPromedioLote: number | null;
  updatedAt: string;
};

const POLL_MS = 2000;
const LIVE_WITHIN_MS = 10_000; // punto verde: lectura de menos de 10s
const STALE_AFTER_MS = 120_000; // se oculta la balanza si no reporta en 2 min

const SEXO_LABEL: Record<string, string> = {
  MACHO: "Macho",
  HEMBRA: "Hembra",
  MEDIANO: "Mediano",
};

export default function MonitorPesaje() {
  const [balanzas, setBalanzas] = useState<Balanza[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const res = await fetch("/api/dashboard/monitor-pesaje", { cache: "no-store" });
        if (cancelled) return;
        if (!res.ok) {
          setError(true);
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setBalanzas(data.balanzas ?? []);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    };
    fetchData();
    const id = setInterval(fetchData, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const visibles = balanzas
    .filter((b) => now - new Date(b.updatedAt).getTime() < STALE_AFTER_MS)
    .sort((a, b) => a.verificador.localeCompare(b.verificador));

  const enVivoCount = visibles.filter((b) => now - new Date(b.updatedAt).getTime() < LIVE_WITHIN_MS).length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {enVivoCount} en vivo
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
          {visibles.length} balanza{visibles.length === 1 ? "" : "s"} activa{visibles.length === 1 ? "" : "s"}
        </span>
        {error && (
          <span className="rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-700">
            Reintentando conexión…
          </span>
        )}
      </div>

      {visibles.length === 0 ? (
        <div className="rounded-xl bg-white px-4 py-16 text-center text-slate-400 shadow-sm ring-1 ring-slate-200">
          Ninguna balanza conectada en este momento.
          <br />
          <span className="text-sm">Las lecturas aparecerán aquí cuando los verificadores conecten su báscula Bluetooth.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibles.map((b) => (
            <BalanzaCard key={b.verificador} b={b} now={now} />
          ))}
        </div>
      )}
    </div>
  );
}

function BalanzaCard({ b, now }: { b: Balanza; now: number }) {
  const ageMs = now - new Date(b.updatedAt).getTime();
  const enVivo = ageMs < LIVE_WITHIN_MS;
  const sexo = b.categoria ? SEXO_LABEL[b.categoria] ?? b.categoria : "—";

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      {/* Cabecera: verificador + estado */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <p className="truncate font-semibold text-slate-900">{b.verificador}</p>
        <span
          className="inline-flex flex-none items-center gap-1.5 text-xs font-semibold"
          title={enVivo ? "En vivo" : `Hace ${Math.round(ageMs / 1000)}s`}
        >
          <span className={`h-2.5 w-2.5 rounded-full ${enVivo ? "bg-emerald-500" : "bg-slate-300"}`} />
          <span className={enVivo ? "text-emerald-700" : "text-slate-400"}>
            {enVivo ? "En vivo" : `${Math.round(ageMs / 1000)}s`}
          </span>
        </span>
      </div>

      {/* Peso grande */}
      <div className="px-4 py-4 text-center">
        <p className="text-5xl font-bold tabular-nums text-brand">
          {(b.pesoGramos / 1000).toFixed(3)}
          <span className="ml-1 text-2xl font-semibold text-slate-400">kg</span>
        </p>
      </div>

      {/* Resumen del lote */}
      <dl className="divide-y divide-slate-100 border-t border-slate-100 text-sm">
        <Fila label="Campaña" value={b.campania} />
        <Fila label="Plantel" value={b.plantelCodigo} />
        <Fila label="Galpón" value={b.galpon} />
        <Fila label="Lado" value={b.corral} />
        <Fila label="Sexo" value={sexo} />
        <Fila label="Aves pesadas (hoy)" value={b.avesLote.toLocaleString("es-PE")} />
        <Fila
          label="Peso promedio (hoy)"
          value={b.pesoPromedioLote != null ? `${(b.pesoPromedioLote / 1000).toFixed(3)} kg` : "—"}
          strong
        />
      </dl>
    </div>
  );
}

function Fila({ label, value, strong }: { label: string; value: string | null; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`tabular-nums ${strong ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}>
        {value && value !== "" ? value : "—"}
      </dd>
    </div>
  );
}
