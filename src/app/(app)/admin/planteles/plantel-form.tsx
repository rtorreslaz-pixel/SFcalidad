"use client";

import { useActionState, useRef, useEffect } from "react";
import { createPlantelAction } from "../admin-actions";

export default function PlantelForm({ clientes }: { clientes: { id: string; nombre: string }[] }) {
  const [state, formAction, pending] = useActionState(createPlantelAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <h2 className="font-semibold text-slate-900">Nuevo plantel</h2>
      <input type="text" name="codigo" placeholder="Código (ej. P289)" required className="input" />
      <select name="clienteId" className="input" defaultValue="">
        <option value="">Sin cliente</option>
        {clientes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
          </option>
        ))}
      </select>
      <input type="text" name="zona" placeholder="Zona (ej. Norte)" className="input" />
      <input type="text" name="subZona" placeholder="Subzona (ej. TOSHI)" className="input" />
      <input type="text" name="tipoPlantel" placeholder="Tipo de plantel (ej. CONVENCIONAL)" className="input" />
      <input type="text" name="zonaEvaluacion" placeholder="Zona de evaluación (ej. CD-LIMA)" className="input" />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-600">{state.success}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Agregar"}
      </button>
    </form>
  );
}
