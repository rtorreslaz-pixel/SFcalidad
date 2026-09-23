import { NextRequest } from "next/server";
import { resolveExportUser, tablaResponse } from "@/lib/export-csv";
import {
  construirResumenGalpones,
  filasResumenCorrales,
  filasResumenGalpones,
  leerFiltrosResumen,
} from "@/lib/resumen-galpon";

// Descarga del resumen por galpón. Mismos filtros que la pantalla; Excel con ?formato=xlsx.
// En Excel salen dos pestañas (galpón y corral); en CSV, que es de una sola tabla, va el
// consolidado por galpón. Las filas se arman en lib/resumen-galpon para que estas hojas sean
// exactamente las mismas que acompañan al Excel de la toma de muestras.

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const user = await resolveExportUser(request);
  const filtros = leerFiltrosResumen({
    desde: searchParams.get("desde") ?? undefined,
    hasta: searchParams.get("hasta") ?? undefined,
    plantel: searchParams.get("plantel") ?? undefined,
    tolerancia: searchParams.get("tolerancia") ?? undefined,
  });
  const galpones = await construirResumenGalpones(user, filtros);
  return tablaResponse(
    filasResumenGalpones(galpones, filtros.tolerancia),
    "resumen-galpon",
    searchParams,
    "Resumen por galpon",
    [{ nombre: "Resumen por corral", filas: filasResumenCorrales(galpones, filtros.tolerancia) }],
  );
}
