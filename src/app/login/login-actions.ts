"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, homeRouteForRole, verifyPassword } from "@/lib/auth";

export type LoginResult = { error: string } | undefined;

export async function loginAction(
  _prevState: LoginResult,
  formData: FormData
): Promise<LoginResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Ingresa tu correo y contraseña." };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.activo) {
    return { error: "Credenciales inválidas." };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "Credenciales inválidas." };
  }

  await createSession(user.id);
  redirect(homeRouteForRole(user.role));
}
