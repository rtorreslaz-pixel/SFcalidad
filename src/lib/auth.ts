import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import type { Role } from "@/generated/prisma/enums";

const SESSION_COOKIE = "session_user_id";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 dias
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export type SessionUser = {
  id: string;
  nombre: string;
  email: string;
  role: Role;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, nombre: true, email: true, role: true, activo: true },
  });

  if (!user || !user.activo) return null;

  return { id: user.id, nombre: user.nombre, email: user.email, role: user.role };
}

export function generateApiToken() {
  return randomBytes(32).toString("base64url");
}

export async function requireMobileUser(request: Request): Promise<SessionUser | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return null;

  const user = await prisma.user.findUnique({
    where: { apiToken: token },
    select: { id: true, nombre: true, email: true, role: true, activo: true },
  });

  if (!user || !user.activo) return null;

  return { id: user.id, nombre: user.nombre, email: user.email, role: user.role };
}

// Verificador: solo registra inspecciones nuevas.
// Jefe: solo visualiza el dashboard.
// Supervisor: acceso completo.
// Comercial: solo visualiza el peso de preventa (no entra a calidad ni a catálogos).
export function homeRouteForRole(role: Role): string {
  if (role === "VERIFICADOR") return "/jornadas";
  if (role === "COMERCIAL") return "/dashboard/preventa";
  return "/dashboard";
}

export const ROLE_LABELS: Record<Role, string> = {
  SUPERVISOR: "Supervisor",
  VERIFICADOR: "Verificador",
  JEFE: "Jefe",
  COMERCIAL: "Comercial",
};
