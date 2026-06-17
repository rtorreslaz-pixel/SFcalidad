"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { deleteInspeccionPhotos } from "@/lib/uploads";
import { redirect } from "next/navigation";

export async function updateSaldoAction(
  saldoId: string,
  jornadaId: string,
  field: string,
  value: number | null
) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const allowed = [
    "unidades", "jabas", "kg",
    "unidadesSeleccion", "jabasSeleccion", "kgSeleccion",
    "unidadesRemanente", "jabasRemanente", "kgRemanente",
  ];
  if (!allowed.includes(field)) return { error: "Campo inválido" };

  await prisma.saldoDiaAnterior.update({
    where: { id: saldoId },
    data: { [field]: value },
  });

  return { ok: true };
}

export async function deleteJornadaAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "SUPERVISOR") return;

  const jornadaId = String(formData.get("jornadaId") ?? "");
  if (!jornadaId) return;

  const inspecciones = await prisma.inspeccion.findMany({
    where: { jornadaId },
    select: { id: true },
  });

  // Delete explicitly (rather than relying on the FK's default SetNull) so
  // these rows don't survive as orphaned standalone inspecciones with blank
  // legacy fecha/cliente/verificador — see /api/export's jornada-fallback logic.
  await prisma.$transaction([
    prisma.inspeccion.deleteMany({ where: { jornadaId } }),
    prisma.jornada.delete({ where: { id: jornadaId } }),
  ]);

  await Promise.all(inspecciones.map((insp) => deleteInspeccionPhotos(insp.id)));

  redirect("/jornadas");
}
