"use client";

import { useActionState, useRef, useEffect } from "react";
import { createUsuarioAction } from "../admin-actions";

export default function UsuarioForm() {
  const [state, formAction, pending] = useActionState(createUsuarioAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <h2 className="font-semibold text-slate-900">Nuevo usuario</h2>
      <input type="text" name="nombre" placeholder="Nombre completo" required className="input" />
      <input type="email" name="email" placeholder="Correo" required className="input" />
      <input type="password" name="password" placeholder="Contraseña (mín. 6 caracteres)" required className="input" />
      <select name="role" className="input" defaultValue="VERIFICADOR">
        <option value="VERIFICADOR">Verificador</option>
        <option value="SUPERVISOR">Supervisor</option>
        <option value="JEFE">Jefe</option>
        <option value="COMERCIAL">Comercial</option>
      </select>
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
