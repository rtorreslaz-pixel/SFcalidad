import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, generateApiToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = body?.email;
  const password = body?.password;

  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "email y password son requeridos" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.activo || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }

  let token = user.apiToken;
  if (!token) {
    token = generateApiToken();
    await prisma.user.update({ where: { id: user.id }, data: { apiToken: token } });
  }

  return NextResponse.json({
    token,
    user: { id: user.id, nombre: user.nombre, email: user.email, role: user.role },
  });
}
