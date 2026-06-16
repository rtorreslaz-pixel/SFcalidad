import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import WizardClient from "./wizard-client";

export default async function EvaluacionWizardPage({
  params,
}: {
  params: Promise<{ jornadaId: string; evalId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "JEFE") redirect("/dashboard");

  const { jornadaId, evalId } = await params;

  const [inspeccion, planteles, tiposDefecto] = await Promise.all([
    prisma.inspeccion.findUnique({
      where: { id: evalId },
      include: {
        jornada: { include: { cliente: true } },
        evaluacionesLesion: true,
        defectos: { include: { tipoDefecto: true } },
        fotos: true,
      },
    }),
    prisma.plantel.findMany({ orderBy: { codigo: "asc" } }),
    prisma.tipoDefecto.findMany({ orderBy: { orden: "asc" } }),
  ]);

  if (!inspeccion || inspeccion.jornada?.id !== jornadaId) notFound();

  if (user.role === "VERIFICADOR" && inspeccion.jornada?.verificadorId !== user.id) {
    redirect("/jornadas");
  }

  return (
    <WizardClient
      inspeccion={inspeccion}
      jornadaId={jornadaId}
      planteles={planteles}
      tiposDefecto={tiposDefecto}
      userId={user.id}
    />
  );
}
