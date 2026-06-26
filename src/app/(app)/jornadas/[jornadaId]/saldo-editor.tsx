"use client";

import { useTransition, useState, useRef, useCallback } from "react";
import { updateSaldoAction } from "./jornada-actions";

type Saldo = {
  id: string;
  sexo: "MACHO" | "HEMBRA";
  unidades: number | null;
  jabas: number | null;
  kg: number | null;
  unidadesSeleccion: number | null;
  jabasSeleccion: number | null;
  kgSeleccion: number | null;
  unidadesRemanente: number | null;
  jabasRemanente: number | null;
  kgRemanente: number | null;
};

const GRUPOS = [
  { titulo: "Saldo total", unidades: "unidades", jabas: "jabas", kg: "kg" },
  { titulo: "Considera selección", unidades: "unidadesSeleccion", jabas: "jabasSeleccion", kg: "kgSeleccion" },
  { titulo: "Remanente (post-beneficiado)", unidades: "unidadesRemanente", jabas: "jabasRemanente", kg: "kgRemanente" },
] as const;

export default function SaldoEditor({ saldo, jornadaId }: { saldo: Saldo; jornadaId: string }) {
  const [, startTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const scheduleGuardado = useCallback((field: string, value: number | null) => {
    clearTimeout(timerRef.current);
    setSaveStatus("saving");
    timerRef.current = setTimeout(() => {
      startTransition(async () => {
        await updateSaldoAction(saldo.id, jornadaId, field, value);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      });
    }, 800);
  }, [saldo.id, jornadaId]);

  const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400";

  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
          saldo.sexo === "MACHO" ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"
        }`}>
          {saldo.sexo === "MACHO" ? "Macho" : "Hembra"}
        </span>
        <span className="text-xs text-slate-400">
          {saveStatus === "saving" ? "Guardando..." : saveStatus === "saved" ? "Guardado ✓" : ""}
        </span>
      </div>

      <div className="space-y-3">
        {GRUPOS.map((grupo) => (
          <div key={grupo.titulo}>
            <p className="mb-1 text-xs font-medium text-slate-500">{grupo.titulo}</p>
            <div className="grid grid-cols-3 gap-2">
              <label className="block">
                <span className="mb-0.5 block text-[11px] text-slate-400">Jabas</span>
                <input
                  type="number" min={0}
                  defaultValue={saldo[grupo.jabas] ?? ""}
                  onChange={(e) => scheduleGuardado(grupo.jabas, e.target.value ? Number(e.target.value) : null)}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-0.5 block text-[11px] text-slate-400">Unidades</span>
                <input
                  type="number" min={0}
                  defaultValue={saldo[grupo.unidades] ?? ""}
                  onChange={(e) => scheduleGuardado(grupo.unidades, e.target.value ? Number(e.target.value) : null)}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-0.5 block text-[11px] text-slate-400">Kg</span>
                <input
                  type="number" min={0} step="0.01"
                  defaultValue={saldo[grupo.kg] ?? ""}
                  onChange={(e) => scheduleGuardado(grupo.kg, e.target.value ? Number(e.target.value) : null)}
                  className={inputClass}
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
