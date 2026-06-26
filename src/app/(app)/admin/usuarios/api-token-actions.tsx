"use client";

import { revokeApiTokenAction, rotateApiTokenAction } from "../admin-actions";

export default function ApiTokenActions({ userId, hasToken }: { userId: string; hasToken: boolean }) {
  return (
    <div className="flex gap-2">
      <form
        action={rotateApiTokenAction}
        onSubmit={(e) => {
          if (!confirm("¿Rotar el token de acceso móvil? El celular con sesión activa no podrá sincronizar hasta volver a iniciar sesión.")) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="userId" value={userId} />
        <button
          type="submit"
          className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
        >
          Rotar
        </button>
      </form>
      {hasToken && (
        <form
          action={revokeApiTokenAction}
          onSubmit={(e) => {
            if (!confirm("¿Revocar el acceso móvil? El celular con sesión activa no podrá sincronizar hasta volver a iniciar sesión.")) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="userId" value={userId} />
          <button
            type="submit"
            className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
          >
            Revocar
          </button>
        </form>
      )}
    </div>
  );
}
