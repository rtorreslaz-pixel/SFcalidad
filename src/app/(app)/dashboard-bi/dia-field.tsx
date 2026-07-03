"use client";

import { useRef } from "react";

// Campo de fecha con botón "×" propio: el "Restablecer" nativo del calendario de
// iOS no limpia el input de forma confiable, así que damos una forma segura de
// borrar el día y reaplicar el filtro al instante.
export default function DiaField({ defaultValue }: { defaultValue?: string }) {
  const ref = useRef<HTMLInputElement>(null);

  const limpiar = () => {
    const input = ref.current;
    if (!input) return;
    input.value = "";
    input.form?.requestSubmit();
  };

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500">Día</label>
      <div className="flex items-center gap-1">
        <input ref={ref} type="date" name="dia" defaultValue={defaultValue ?? ""} className="input" />
        {defaultValue ? (
          <button
            type="button"
            onClick={limpiar}
            aria-label="Quitar día"
            title="Quitar día"
            className="flex-none rounded-md border border-slate-300 px-2 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100"
          >
            ×
          </button>
        ) : null}
      </div>
    </div>
  );
}
