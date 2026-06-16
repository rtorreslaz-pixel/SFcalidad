"use client";

import { useActionState } from "react";
import { createJornadaAction } from "./jornada-actions";

type Cliente = { id: string; nombre: string };

export default function JornadaForm({ clientes, userId }: { clientes: Cliente[]; userId: string }) {
  const [state, formAction, pending] = useActionState(createJornadaAction, undefined);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">Fecha <span className="text-red-500">*</span></span>
        <input type="date" name="fecha" defaultValue={today} required className="input" />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">Cliente / Distribuidor <span className="text-red-500">*</span></span>
        <select name="clienteId" required className="input">
          <option value="">Selecciona...</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </label>

      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Creando..." : "Iniciar jornada"}
      </button>
    </form>
  );
}
