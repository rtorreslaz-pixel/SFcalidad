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

function kg(gramos: number | null | undefined): string {
  return gramos != null ? `${(gramos / 1000).toFixed(3)} kg` : "—";
}

export default function MonitorPesaje() {
  const [balanzas, setBalanzas] = useState<Balanza[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<string>("");

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

  // La balanza elegida en el selector; si desaparece o no hay selección, cae a la primera.
  const selectedBalanza = visibles.find((b) => b.verificador === selected) ?? visibles[0] ?? null;

  return (
    <div>
      {/* Estado general */}
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
          <span className="text-sm">
            Las lecturas aparecerán aquí cuando los verificadores conecten su báscula Bluetooth.
          </span>
        </div>
      ) : (
        <>
          {/* Selector de balanza */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <label htmlFor="balanza-select" className="text-sm font-semibold text-slate-600">
              Dashboard de la balanza:
            </label>
            <select
              id="balanza-select"
              value={selectedBalanza?.verificador ?? ""}
              onChange={(e) => setSelected(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            >
              {visibles.map((b) => (
                <option key={b.verificador} value={b.verificador}>
                  {b.verificador}
                </option>
              ))}
            </select>
          </div>

          {/* Dashboard detallado de la balanza seleccionada */}
          {selectedBalanza && <DetallePanel b={selectedBalanza} now={now} />}

          {/* Tabla de las 10 balanzas */}
          <TablaBalanzas
            balanzas={visibles}
            now={now}
            selected={selectedBalanza?.verificador}
            onSelect={setSelected}
          />
        </>
      )}
    </div>
  );
}

function estado(ageMs: number): { enVivo: boolean; texto: string } {
  const enVivo = ageMs < LIVE_WITHIN_MS;
  return { enVivo, texto: enVivo ? "En vivo" : `${Math.round(ageMs / 1000)}s` };
}

function DetallePanel({ b, now }: { b: Balanza; now: number }) {
  const ageMs = now - new Date(b.updatedAt).getTime();
  const { enVivo, texto } = estado(ageMs);
  const sexo = b.categoria ? SEXO_LABEL[b.categoria] ?? b.categoria : "—";

  return (
    <div className="mb-6 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
        <h2 className="truncate font-semibold text-slate-900">{b.verificador}</h2>
        <span className="inline-flex flex-none items-center gap-1.5 text-xs font-semibold" title={texto}>
          <span className={`h-2.5 w-2.5 rounded-full ${enVivo ? "bg-emerald-500" : "bg-slate-300"}`} />
          <span className={enVivo ? "text-emerald-700" : "text-slate-400"}>{texto}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* Peso grande */}
        <div className="flex flex-col items-center justify-center border-b border-slate-100 px-5 py-8 md:border-b-0 md:border-r">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Peso en vivo</p>
          <p className="mt-1 text-6xl font-bold tabular-nums text-brand">
            {(b.pesoGramos / 1000).toFixed(3)}
            <span className="ml-1 text-3xl font-semibold text-slate-400">kg</span>
          </p>
          <p className="mt-3 text-sm text-slate-500">
            {b.avesLote.toLocaleString("es-PE")} aves pesadas hoy
          </p>
        </div>

        {/* Resumen de pesos */}
        <div>
          <p className="border-b border-slate-100 px-5 pt-4 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Resumen del lote
          </p>
          <dl className="divide-y divide-slate-100 text-sm">
            <Fila label="Campaña" value={b.campania} />
            <Fila label="Plantel" value={b.plantelCodigo} />
            <Fila label="Galpón" value={b.galpon} />
            <Fila label="Lado" value={b.corral} />
            <Fila label="Sexo" value={sexo} />
            <Fila label="Peso promedio (hoy)" value={kg(b.pesoPromedioLote)} strong />
          </dl>
        </div>
      </div>
    </div>
  );
}

function Fila({ label, value, strong }: { label: string; value: string | null; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between px-5 py-2.5">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`tabular-nums ${strong ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}>
        {value && value !== "" ? value : "—"}
      </dd>
    </div>
  );
}

function TablaBalanzas({
  balanzas,
  now,
  selected,
  onSelect,
}: {
  balanzas: Balanza[];
  now: number;
  selected?: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="font-semibold text-slate-900">Todas las balanzas</h2>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2.5 font-medium">Balanza</th>
            <th className="px-3 py-2.5 font-medium">Estado</th>
            <th className="px-3 py-2.5 text-right font-medium">Peso</th>
            <th className="px-3 py-2.5 font-medium">Campaña</th>
            <th className="px-3 py-2.5 font-medium">Plantel</th>
            <th className="px-3 py-2.5 font-medium">Galpón</th>
            <th className="px-3 py-2.5 font-medium">Lado</th>
            <th className="px-3 py-2.5 font-medium">Sexo</th>
            <th className="px-3 py-2.5 text-right font-medium">Aves hoy</th>
            <th className="px-3 py-2.5 text-right font-medium">Prom. hoy</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {balanzas.map((b) => {
            const ageMs = now - new Date(b.updatedAt).getTime();
            const { enVivo, texto } = estado(ageMs);
            const sexo = b.categoria ? SEXO_LABEL[b.categoria] ?? b.categoria : "—";
            const isSelected = b.verificador === selected;
            return (
              <tr
                key={b.verificador}
                onClick={() => onSelect(b.verificador)}
                className={`cursor-pointer ${isSelected ? "bg-brand/5" : "hover:bg-slate-50"}`}
              >
                <td className="px-3 py-2 font-medium text-slate-900">{b.verificador}</td>
                <td className="px-3 py-2">
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${enVivo ? "bg-emerald-500" : "bg-slate-300"}`} />
                    <span className={enVivo ? "text-emerald-700" : "text-slate-400"}>{texto}</span>
                  </span>
                </td>
                <td className="px-3 py-2 text-right font-bold tabular-nums text-brand">
                  {(b.pesoGramos / 1000).toFixed(3)}
                </td>
                <td className="px-3 py-2">{b.campania ?? "—"}</td>
                <td className="px-3 py-2">{b.plantelCodigo ?? "—"}</td>
                <td className="px-3 py-2">{b.galpon ?? "—"}</td>
                <td className="px-3 py-2">{b.corral ?? "—"}</td>
                <td className="px-3 py-2">{sexo}</td>
                <td className="px-3 py-2 text-right tabular-nums">{b.avesLote.toLocaleString("es-PE")}</td>
                <td className="px-3 py-2 text-right tabular-nums">{kg(b.pesoPromedioLote)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
