"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getISOWeek } from "@/lib/calc";

export type JornadaActionResult = { error: string } | undefined;

export async function createJornadaAction(
  _prev: JornadaActionResult,
  formData: FormData
): Promise<JornadaActionResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const fechaStr = String(formData.get("fecha") ?? "");
  const clienteId = String(formData.get("clienteId") ?? "");

  if (!fechaStr || !clienteId) {
    return { error: "Completa la fecha y el cliente." };
  }

  const fecha = new Date(fechaStr + "T00:00:00.000Z");
  if (Number.isNaN(fecha.getTime())) return { error: "Fecha inválida." };

  const jornada = await prisma.jornada.create({
    data: {
      fecha,
      anio: fecha.getUTCFullYear(),
      mes: fecha.getUTCMonth() + 1,
      semana: getISOWeek(fecha),
      clienteId,
      verificadorId: user.id,
      saldos: {
        create: [
          { sexo: "MACHO" },
          { sexo: "HEMBRA" },
        ],
      },
    },
  });

  redirect(`/jornadas/${jornada.id}`);
}
