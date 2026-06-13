"use client";

import { useTransition } from "react";
import { toggleUsuarioActivoAction } from "../admin-actions";

export default function ToggleActivoButton({ userId, activo }: { userId: string; activo: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => toggleUsuarioActivoAction(userId))}
      disabled={pending}
      className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-60"
    >
      {activo ? "Desactivar" : "Activar"}
    </button>
  );
}
