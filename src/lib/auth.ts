import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import type { Role } from "@/generated/prisma/enums";

const SESSION_COOKIE = "session_token";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 días

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await prisma.session.create({ data: { token, userId, expiresAt } });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  cookieStore.delete(SESSION_COOKIE);
}

export type SessionUser = {
  id: string;
  nombre: string;
  email: string;
  role: Role;
  mustChangePassword: boolean;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    select: {
      expiresAt: true,
      user: { select: { id: true, nombre: true, email: true, role: true, activo: true, mustChangePassword: true } },
    },
  });

  if (!session || session.expiresAt < new Date() || !session.user.activo) {
    // Sesión inválida/expirada: se limpia si estaba vencida.
    if (session && session.expiresAt < new Date()) {
      await prisma.session.deleteMany({ where: { token } });
    }
    return null;
  }

  const u = session.user;
  return { id: u.id, nombre: u.nombre, email: u.email, role: u.role, mustChangePassword: u.mustChangePassword };
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
    select: { id: true, nombre: true, email: true, role: true, activo: true, mustChangePassword: true },
  });

  if (!user || !user.activo) return null;

  return { id: user.id, nombre: user.nombre, email: user.email, role: user.role, mustChangePassword: user.mustChangePassword };
}

// Verificador: solo registra inspecciones nuevas.
// Jefe: solo visualiza el dashboard.
// Supervisor: acceso completo.
// Comercial: solo visualiza el peso de preventa (no entra a calidad ni a catálogos).
export function homeRouteForRole(role: Role): string {
  if (role === "VERIFICADOR") return "/jornadas";
  if (role === "COMERCIAL") return "/dashboard/pesaje";
  return "/dashboard-bi";
}

export const ROLE_LABELS: Record<Role, string> = {
  SUPERVISOR: "Supervisor",
  VERIFICADOR: "Verificador",
  JEFE: "Jefe",
  COMERCIAL: "Comercial",
};
