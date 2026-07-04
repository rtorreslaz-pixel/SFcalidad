"use client";

import { useActionState } from "react";
import { cambiarClaveAction } from "./actions";

const inputClass =
  "mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

export default function CambiarClaveForm() {
  const [state, formAction, pending] = useActionState(cambiarClaveAction, undefined);

  return (
    <form action={formAction} className="space-y-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div>
        <label htmlFor="actual" className="block text-sm font-medium text-slate-700">Contraseña actual</label>
        <input id="actual" name="actual" type="password" required autoComplete="current-password" className={inputClass} />
      </div>
      <div>
        <label htmlFor="nueva" className="block text-sm font-medium text-slate-700">Nueva contraseña</label>
        <input id="nueva" name="nueva" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
        <p className="mt-1 text-xs text-slate-400">Mínimo 8 caracteres.</p>
      </div>
      <div>
        <label htmlFor="confirmar" className="block text-sm font-medium text-slate-700">Confirmar nueva contraseña</label>
        <input id="confirmar" name="confirmar" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
      </div>
      {state?.error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-hover disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Cambiar contraseña"}
      </button>
    </form>
  );
}
