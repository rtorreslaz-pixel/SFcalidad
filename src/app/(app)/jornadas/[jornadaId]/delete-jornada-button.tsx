"use client";

import { deleteJornadaAction } from "./jornada-actions";

export default function DeleteJornadaButton({ jornadaId }: { jornadaId: string }) {
  return (
    <form
      action={deleteJornadaAction}
      onSubmit={(e) => {
        if (!confirm("¿Eliminar esta jornada y todas sus evaluaciones? Esta acción no se puede deshacer.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="jornadaId" value={jornadaId} />
      <button type="submit" className="text-sm text-red-500 hover:text-red-700 hover:underline">
        Eliminar jornada
      </button>
    </form>
  );
}
