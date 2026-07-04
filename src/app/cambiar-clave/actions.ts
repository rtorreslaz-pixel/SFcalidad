"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, getCurrentUser, hashPassword, homeRouteForRole, verifyPassword } from "@/lib/auth";

export type CambiarResult = { error: string } | undefined;

export async function cambiarClaveAction(_prev: CambiarResult, formData: FormData): Promise<CambiarResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const actual = String(formData.get("actual") ?? "");
  const nueva = String(formData.get("nueva") ?? "");
  const confirmar = String(formData.get("confirmar") ?? "");

  if (!actual || !nueva || !confirmar) return { error: "Completa todos los campos." };
  if (nueva.length < 8) return { error: "La nueva contraseña debe tener al menos 8 caracteres." };
  if (nueva !== confirmar) return { error: "Las contraseñas no coinciden." };

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (!dbUser || !(await verifyPassword(actual, dbUser.passwordHash))) {
    return { error: "La contraseña actual es incorrecta." };
  }
  if (await verifyPassword(nueva, dbUser.passwordHash)) {
    return { error: "La nueva contraseña debe ser distinta de la actual." };
  }

  const passwordHash = await hashPassword(nueva);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash, mustChangePassword: false } });
  // Revoca todas las sesiones abiertas (incluida la actual) y emite una nueva:
  // si el cambio fue por sospecha, las demás quedan cerradas.
  await prisma.session.deleteMany({ where: { userId: user.id } });
  await createSession(user.id);

  redirect(homeRouteForRole(user.role));
}
