import { NextRequest, NextResponse } from "next/server";
import { tokenValido, APILAMIENTO_TOKEN_PARAM } from "@/lib/apilamiento-token";
import { saveApilamientoMedia, MAX_VIDEO_BYTES } from "@/lib/uploads";
import { checkLimit } from "@/lib/rate-limit";

// Sube UNA foto o video de evidencia. Se sube por separado (no junto con el formulario) para
// que un video de varios MB no choque con el límite de cuerpo del envío final y para que el
// verificador vea el progreso archivo por archivo.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  if (!tokenValido(searchParams.get(APILAMIENTO_TOKEN_PARAM))) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Tope por IP: evita que el enlace compartido se use para llenar el disco.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "desconocida";
  const limite = checkLimit(`apilamiento-media:${ip}`, 120, 60 * 60 * 1000);
  if (limite.limited) {
    return NextResponse.json(
      { error: "Demasiadas subidas seguidas. Espera un momento e intenta de nuevo." },
      { status: 429 }
    );
  }

  const form = await request.formData().catch(() => null);
  const registroId = String(form?.get("registroId") ?? "");
  const file = form?.get("file");

  if (!UUID_RE.test(registroId)) {
    return NextResponse.json({ error: "Registro inválido." }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No se recibió el archivo." }, { status: 400 });
  }

  const guardada = await saveApilamientoMedia(registroId, file);
  if (!guardada) {
    return NextResponse.json(
      {
        error: `Archivo no admitido. Se aceptan fotos (JPG/PNG/HEIC) y videos cortos (MP4/MOV) de hasta ${Math.round(
          MAX_VIDEO_BYTES / (1024 * 1024)
        )} MB.`,
      },
      { status: 400 }
    );
  }

  return NextResponse.json(guardada);
}
