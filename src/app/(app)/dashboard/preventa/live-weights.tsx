"use client";

import { useEffect, useState } from "react";

type LiveLectura = {
  verificador: string;
  pesoGramos: number;
  plantelCodigo: string | null;
  campania: string | null;
  galpon: string | null;
  corral: string | null;
  categoria: string | null;
  updatedAt: string;
};

const POLL_MS = 2000;
const STALE_AFTER_MS = 120_000;
const LIVE_WITHIN_MS = 10_000;

export default function LiveWeights() {
  const [lecturas, setLecturas] = useState<LiveLectura[]>([]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    const fetchLecturas = async () => {
      try {
        const res = await fetch("/api/dashboard/live-weights", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled) setLecturas(data.lecturas ?? []);
      } catch {
        // red caída momentáneamente: se reintenta en el siguiente ciclo, sin alarmar al usuario
      }
    };
    fetchLecturas();
    const id = setInterval(fetchLecturas, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const visibles = lecturas.filter((l) => now - new Date(l.updatedAt).getTime() < STALE_AFTER_MS);

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <h2 className="mb-3 font-semibold text-slate-900">Peso en vivo</h2>
      {visibles.length === 0 ? (
        <p className="text-sm text-slate-400">Ningún verificador conectado a una báscula en este momento.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {visibles.map((l) => {
            const ageMs = now - new Date(l.updatedAt).getTime();
            const enVivo = ageMs < LIVE_WITHIN_MS;
            const ubicacion = [
              l.plantelCodigo,
              l.campania,
              l.galpon && `G${l.galpon}`,
              l.categoria,
              l.corral,
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <li key={l.verificador} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-slate-900">{l.verificador}</p>
                  {ubicacion && <p className="text-xs text-slate-500">{ubicacion}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${enVivo ? "bg-emerald-500" : "bg-slate-300"}`}
                    title={enVivo ? "En vivo" : `Hace ${Math.round(ageMs / 1000)}s`}
                  />
                  <span className="text-lg font-bold tabular-nums text-slate-900">
                    {(l.pesoGramos / 1000).toFixed(2)} kg
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
