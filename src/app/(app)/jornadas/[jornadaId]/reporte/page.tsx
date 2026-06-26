import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import PrintButton from "../../print-button";
import ReporteCard, { JORNADA_REPORTE_INCLUDE } from "../../reporte-card";

export default async function ReporteDiarioPage({
  params,
}: {
  params: Promise<{ jornadaId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "JEFE") redirect("/dashboard");

  const { jornadaId } = await params;

  const jornada = await prisma.jornada.findUnique({
    where: { id: jornadaId },
    include: JORNADA_REPORTE_INCLUDE,
  });

  if (!jornada) notFound();
  if (user.role === "VERIFICADOR" && jornada.verificadorId !== user.id) {
    redirect("/jornadas");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href={`/jornadas/${jornadaId}`} className="text-sm text-emerald-700 hover:underline">
          ← Volver a la jornada
        </Link>
        <PrintButton />
      </div>

      <ReporteCard jornada={jornada} />
    </div>
  );
}
