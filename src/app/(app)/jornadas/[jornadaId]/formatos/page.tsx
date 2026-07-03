import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import PrintButton from "../../print-button";
import {
  FormatoAlmohadillas,
  FormatoSeleccion,
  JORNADA_FORMATO_INCLUDE,
} from "../../formato-print";

export default async function FormatosPage({
  params,
}: {
  params: Promise<{ jornadaId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "JEFE") redirect("/dashboard-bi");

  const { jornadaId } = await params;

  const jornada = await prisma.jornada.findUnique({
    where: { id: jornadaId },
    include: JORNADA_FORMATO_INCLUDE,
  });

  if (!jornada) notFound();
  if (user.role === "VERIFICADOR" && jornada.verificadorId !== user.id) {
    redirect("/jornadas");
  }

  // Una página de selección por cada inspección con censo de beneficiado;
  // las que solo traen lesión/pigmentación alimentan el formato de almohadillas.
  const inspeccionesSeleccion = jornada.inspecciones.filter((i) => !i.soloLesionPigmentacion);

  return (
    <div className="mx-auto max-w-[800px]">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href={`/jornadas/${jornadaId}`} className="text-sm text-emerald-700 hover:underline">
          ← Volver a la jornada
        </Link>
        <PrintButton />
      </div>

      <p className="mb-4 text-sm text-slate-500 print:hidden">
        Formatos clasificados de la jornada — {jornada.cliente.nombre}. Usa “Imprimir / Guardar PDF”
        para descargar el documento.
      </p>

      <div className="space-y-6">
        <div className="print:break-after-page">
          <FormatoAlmohadillas jornada={jornada} />
        </div>

        {inspeccionesSeleccion.map((insp) => (
          <div key={insp.id} className="print:break-after-page">
            <FormatoSeleccion jornada={jornada} inspeccion={insp} />
          </div>
        ))}
      </div>
    </div>
  );
}
