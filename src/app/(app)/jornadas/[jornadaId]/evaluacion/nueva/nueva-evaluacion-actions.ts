"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function createEvaluacionAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const jornadaId = String(formData.get("jornadaId") ?? "");
  if (!jornadaId) return;

  const jornada = await prisma.jornada.findUnique({ where: { id: jornadaId } });
  if (!jornada) return;

  if (user.role === "VERIFICADOR" && jornada.verificadorId !== user.id) return;

  const inspeccion = await prisma.inspeccion.create({
    data: {
      jornadaId,
      estado: "BORRADOR",
      pasoActual: 1,
      cantidad: 0,
    },
  });

  redirect(`/jornadas/${jornadaId}/evaluacion/${inspeccion.id}`);
}
