"use client";

import { useTransition, useState, useRef, useCallback } from "react";
import { updateSaldoAction } from "./jornada-actions";

type Saldo = {
  id: string;
  sexo: "MACHO" | "HEMBRA";
  unidades: number;
  jabas: number;
  unidadesSeleccion: number;
  remanente: number | null;
};

export default function SaldoEditor({ saldo, jornadaId }: { saldo: Saldo; jornadaId: string }) {
  const [isPending, startTransition] = useTransition();
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

  const inputClass = "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-base focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400";

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
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-xs text-slate-500">Unidades</span>
          <input
            type="number" min={0}
            defaultValue={saldo.unidades || ""}
            onChange={(e) => scheduleGuardado("unidades", Number(e.target.value) || 0)}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-slate-500">Jabas</span>
          <input
            type="number" min={0}
            defaultValue={saldo.jabas || ""}
            onChange={(e) => scheduleGuardado("jabas", Number(e.target.value) || 0)}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-slate-500">Considera selección</span>
          <input
            type="number" min={0}
            defaultValue={saldo.unidadesSeleccion || ""}
            onChange={(e) => scheduleGuardado("unidadesSeleccion", Number(e.target.value) || 0)}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-slate-500">Remanente</span>
          <input
            type="number" min={0}
            defaultValue={saldo.remanente ?? ""}
            onChange={(e) => scheduleGuardado("remanente", e.target.value ? Number(e.target.value) : null)}
            className={inputClass}
          />
        </label>
      </div>
    </div>
  );
}
