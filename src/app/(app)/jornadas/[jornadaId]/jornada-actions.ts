"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function updateSaldoAction(
  saldoId: string,
  jornadaId: string,
  field: string,
  value: number | null
) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const allowed = ["unidades", "jabas", "unidadesSeleccion", "remanente"];
  if (!allowed.includes(field)) return { error: "Campo inválido" };

  await prisma.saldoDiaAnterior.update({
    where: { id: saldoId },
    data: { [field]: value },
  });

  return { ok: true };
}
