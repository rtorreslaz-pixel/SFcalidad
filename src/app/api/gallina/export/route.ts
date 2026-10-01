import { NextRequest } from "next/server";
import { resolveExportUser, tablaResponse } from "@/lib/export-csv";
import {
  construirDespachos,
  filasAnuladasGallina,
  filasGallina,
  filasResumenDespachos,
  leerFiltrosGallina,
} from "@/lib/gallina";

// Descarga del módulo de gallina. Mismos filtros que la pantalla; Excel con ?formato=xlsx.
// Dos hojas: el detalle pesada por pesada (el formato del archivo de referencia) y un
// resumen con un renglón por despacho.

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const user = await resolveExportUser(request);
  const filtros = leerFiltrosGallina({
    desde: searchParams.get("desde") ?? undefined,
    hasta: searchParams.get("hasta") ?? undefined,
    cliente: searchParams.get("cliente") ?? undefined,
    material: searchParams.get("material") ?? undefined,
    guia: searchParams.get("guia") ?? undefined,
  });
  const despachos = await construirDespachos(user, filtros);
  return tablaResponse(
    filasGallina(despachos),
    "gallina",
    searchParams,
    "Detalle de pesos",
    [
      { nombre: "Resumen por despacho", filas: filasResumenDespachos(despachos) },
      // Los anulados van en su propia hoja: el detalle queda limpio y la trazabilidad viaja
      // igual en el archivo.
      { nombre: "Anulados", filas: filasAnuladasGallina(despachos) },
    ],
  );
}
