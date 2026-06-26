import { NextRequest, NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  await destroySession();

  // Behind Railway's proxy, request.url resolves to the internal bind
  // address (e.g. localhost:8080) rather than the public domain, so the
  // redirect target must be built from the forwarded headers instead.
  const proto = request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", "");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? new URL(request.url).host;

  return NextResponse.redirect(`${proto}://${host}/login`, 303);
}
