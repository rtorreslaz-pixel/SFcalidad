"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { createSession, homeRouteForRole, verifyPassword } from "@/lib/auth";
import { checkLimit, registerFailure, clearFailures } from "@/lib/rate-limit";

export type LoginResult = { error: string } | undefined;

// Límites: 8 intentos fallidos por (IP+correo) y 40 por IP, en ventana de 15 min.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_POR_CORREO = 8;
const MAX_POR_IP = 40;

export async function loginAction(
  _prevState: LoginResult,
  formData: FormData
): Promise<LoginResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Ingresa tu correo y contraseña." };
  }

  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? "desconocida").trim();
  const keyCorreo = `login:${ip}:${email}`;
  const keyIp = `login-ip:${ip}`;

  const lim =
    checkLimit(keyCorreo, MAX_POR_CORREO, WINDOW_MS).limited
      ? checkLimit(keyCorreo, MAX_POR_CORREO, WINDOW_MS)
      : checkLimit(keyIp, MAX_POR_IP, WINDOW_MS);
  if (lim.limited) {
    return { error: `Demasiados intentos fallidos. Espera ${Math.ceil(lim.retryAfterSec / 60)} minutos e inténtalo de nuevo.` };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const valid = user && user.activo && (await verifyPassword(password, user.passwordHash));

  if (!valid) {
    registerFailure(keyCorreo, WINDOW_MS);
    registerFailure(keyIp, WINDOW_MS);
    return { error: "Credenciales inválidas." };
  }

  clearFailures(keyCorreo, keyIp);
  await createSession(user.id);
  redirect(homeRouteForRole(user.role));
}
