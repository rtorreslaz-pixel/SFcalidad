/**
 * Script de prueba para el clasificador de pigmentación (análisis de color con sharp).
 * Uso: node scripts/test-pigmentacion.mjs <imagen.jpg> [imagen2.jpg ...]
 * No requiere API key — usa análisis de color local.
 */
import sharp from "sharp";

const GRADO_THRESHOLDS = [
  { grado: 0, satMin: 0,  satMax: 18, label: "Sin pigmentación (fuera de abanico)" },
  { grado: 1, satMin: 18, satMax: 32, label: "Amarillo muy pálido" },
  { grado: 2, satMin: 32, satMax: 48, label: "Amarillo pálido" },
  { grado: 3, satMin: 48, satMax: 62, label: "Amarillo medio" },
  { grado: 4, satMin: 62, satMax: 76, label: "Amarillo intenso / dorado" },
  { grado: 5, satMin: 76, satMax: 100, label: "Amarillo-naranja intenso" },
];

function rgbToHsv(r, g, b) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
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

async function clasificar(imagePath) {
  const meta = await sharp(imagePath).metadata();
  const w = meta.width, h = meta.height;
  const cropW = Math.round(w * 0.4), cropH = Math.round(h * 0.4);
  const left = Math.round((w - cropW) / 2), top = Math.round((h - cropH) / 2);

  const { data, info } = await sharp(imagePath)
    .extract({ left, top, width: cropW, height: cropH })
    .resize(50, 50)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let r = 0, g = 0, b = 0;
  const pixels = info.width * info.height;
  for (let i = 0; i < data.length; i += 3) { r += data[i]; g += data[i+1]; b += data[i+2]; }
  r /= pixels; g /= pixels; b /= pixels;

  const hsv = rgbToHsv(r, g, b);
  const esAmarillo = hsv.h >= 25 && hsv.h <= 75;

  let resultado;
  if (!esAmarillo) {
    resultado = { grado: 0, confianza: "alta", descripcion: "Tono fuera del rango amarillo" };
  } else {
    const match = GRADO_THRESHOLDS.find(t => hsv.s >= t.satMin && hsv.s < t.satMax) ?? GRADO_THRESHOLDS.at(-1);
    const rango = match.satMax - match.satMin;
    const distancia = Math.abs(hsv.s - (match.satMin + rango / 2)) / (rango / 2);
    const confianza = distancia < 0.3 ? "alta" : distancia < 0.65 ? "media" : "baja";
    resultado = { grado: match.grado, confianza, descripcion: match.label };
  }

  console.log(`\nImagen: ${imagePath}`);
  console.log(`  RGB promedio (centro): R=${Math.round(r)} G=${Math.round(g)} B=${Math.round(b)}`);
  console.log(`  HSV: H=${Math.round(hsv.h)}° S=${Math.round(hsv.s)}% V=${Math.round(hsv.v)}%`);
  console.log(`  → GRADO ${resultado.grado} | Confianza: ${resultado.confianza}`);
  console.log(`  → ${resultado.descripcion}`);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log("Uso: node scripts/test-pigmentacion.mjs <imagen.jpg> [imagen2.jpg ...]");
  process.exit(0);
}
for (const img of args) await clasificar(img);
