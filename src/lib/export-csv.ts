import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { timingSafeEqual } from "crypto";
import { getCurrentUser, type SessionUser } from "@/lib/auth";
import type { Prisma } from "@/generated/prisma/client";

export function csvEscape(value: string | number | null | undefined): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function tokenMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function resolveExportUser(request: NextRequest): Promise<SessionUser | null> {
  const { searchParams } = new URL(request.url);
  const expectedToken = process.env.EXPORT_API_TOKEN;
  const providedToken = searchParams.get("token");
  const tokenAuthorized = !!expectedToken && !!providedToken && tokenMatches(providedToken, expectedToken);

  if (tokenAuthorized) return null;

  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export function buildInspeccionWhere(
  searchParams: URLSearchParams,
  user: SessionUser | null
): Prisma.InspeccionWhereInput {
  const where: Prisma.InspeccionWhereInput = {};
  if (user?.role === "VERIFICADOR") {
    where.verificadorId = user.id;
  } else if (searchParams.get("verificadorId")) {
    where.verificadorId = searchParams.get("verificadorId")!;
  }
  if (searchParams.get("clienteId")) where.clienteId = searchParams.get("clienteId")!;
  const desde = searchParams.get("desde");
  const hasta = searchParams.get("hasta");
  if (desde || hasta) {
    where.fecha = {};
    if (desde) where.fecha.gte = new Date(desde);
    if (hasta) where.fecha.lte = new Date(hasta + "T23:59:59");
  }
  return where;
}

export function csvResponse(rows: (string | number)[][], filenamePrefix: string): NextResponse {
  const csv = rows.map((row) => row.map(csvEscape).join(";")).join("\n");
  const bom = "﻿"; // para que Excel reconozca UTF-8

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
