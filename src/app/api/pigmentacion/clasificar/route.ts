import sharp from "sharp";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// Referencia de saturación HSV para cada grado del abanico DSM/Roche (0-5)
// Ajustar estos umbrales si las fotos del entorno muestran desvíos sistemáticos.
// Umbrales calibrados con fotos reales del abanico DSM/Roche (grados 1-4 validados en campo)
const GRADO_THRESHOLDS = [
  { grado: 0, satMin: 0,  satMax: 25, label: "Sin pigmentación (fuera de abanico)" },
  { grado: 1, satMin: 25, satMax: 42, label: "Amarillo muy pálido" },
  { grado: 2, satMin: 42, satMax: 56, label: "Amarillo pálido" },
  { grado: 3, satMin: 56, satMax: 71, label: "Amarillo medio" },
  { grado: 4, satMin: 71, satMax: 80, label: "Amarillo intenso / dorado" },
  { grado: 5, satMin: 80, satMax: 100, label: "Amarillo-naranja intenso" },
];

function rgbToHsv(r: number, g: number, b: number) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  const v = max * 100;
  const s = max === 0 ? 0 : (delta / max) * 100;
  let h = 0;
  if (delta > 0) {
    if (max === rn) h = 60 * (((gn - bn) / delta) % 6);
    else if (max === gn) h = 60 * ((bn - rn) / delta + 2);
    else h = 60 * ((rn - gn) / delta + 4);
    if (h < 0) h += 360;
  }
  return { h, s, v };
}

function clasificarGrado(s: number, h: number): { grado: number; confianza: string; descripcion: string } {
  const esAmarillo = h >= 25 && h <= 75;
  if (!esAmarillo) {
    return { grado: 0, confianza: "alta", descripcion: "Tono fuera del rango amarillo, no coincide con el abanico" };
  }

  const match = GRADO_THRESHOLDS.find((t) => s >= t.satMin && s < t.satMax)
    ?? GRADO_THRESHOLDS[GRADO_THRESHOLDS.length - 1];

  const rango = match.satMax - match.satMin;
  const centro = match.satMin + rango / 2;
  const distancia = Math.abs(s - centro) / (rango / 2);
  const confianza = distancia < 0.3 ? "alta" : distancia < 0.65 ? "media" : "baja";

  return { grado: match.grado, confianza, descripcion: match.label };
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const form = await req.formData();
    const file = form.get("imagen") as File | null;
    if (!file) return NextResponse.json({ error: "Imagen requerida" }, { status: 400 });

    const bytes = Buffer.from(await file.arrayBuffer());

    const meta = await sharp(bytes).metadata();
    const w = meta.width ?? 100;
    const h = meta.height ?? 100;
    const cropW = Math.round(w * 0.4);
    const cropH = Math.round(h * 0.4);
    const left = Math.round((w - cropW) / 2);
    const top = Math.round((h - cropH) / 2);

    const stats = await sharp(bytes)
      .extract({ left, top, width: cropW, height: cropH })
      .resize(80, 80)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
      .then(({ data }) => {
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 3) {
          const pr = data[i], pg = data[i + 1], pb = data[i + 2];
          // Filtrar solo pixels amarillos/naranja — ignorar fondo gris/azul/oscuro
          const max = Math.max(pr, pg, pb);
          const min = Math.min(pr, pg, pb);
          const sat = max === 0 ? 0 : (max - min) / max;
          const esAmarillo = pr > pb && pg > pb && sat > 0.2 && max > 80;
          if (esAmarillo) { r += pr; g += pg; b += pb; count++; }
        }
        if (count < 100) return { r: 200, g: 200, b: 200, escasos: true };
        return { r: r / count, g: g / count, b: b / count, escasos: false };
      });

    const hsv = rgbToHsv(stats.r, stats.g, stats.b);
    const resultado = stats.escasos
      ? { grado: 0, confianza: "media" as const, descripcion: "Pocas zonas amarillas detectadas — posible Grado 0 o foto sin patas visibles" }
      : clasificarGrado(hsv.s, hsv.h);

    return NextResponse.json({
      ...resultado,
      _debug: { r: Math.round(stats.r), g: Math.round(stats.g), b: Math.round(stats.b), h: Math.round(hsv.h), s: Math.round(hsv.s), v: Math.round(hsv.v) },
    });
  } catch (err) {
    console.error("Error clasificando pigmentación:", err);
    return NextResponse.json({ error: "No se pudo procesar la imagen" }, { status: 500 });
  }
}
