/**
 * Script de prueba para el clasificador de pigmentación.
 * Uso: ANTHROPIC_API_KEY=sk-ant-... node scripts/test-pigmentacion.mjs
 */
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const client = new Anthropic();

const SYSTEM_PROMPT = `Eres un experto en clasificación de pigmentación en pollos de engorde.
Tu tarea es analizar la foto de las patas de un pollo y clasificar su nivel de pigmentación
usando la escala del abanico colorimétrico DSM/Roche, que va de 0 a 5:

- Grado 0: Color blanquecino / pálido — NO coincide con ningún nivel del abanico
- Grado 1: Amarillo muy pálido (primer nivel del abanico)
- Grado 2: Amarillo pálido
- Grado 3: Amarillo medio
- Grado 4: Amarillo intenso / dorado
- Grado 5: Amarillo-naranja intenso (máximo del abanico)

Analiza la zona de las patas (tarso/metatarso) ignorando manchas, moretones o suciedad superficial.
Responde SOLO con un JSON válido, sin texto extra:
{"grado": <número 0-5>, "confianza": "<alta|media|baja>", "descripcion": "<breve descripción del color observado>"}`;

async function clasificar(imagePath) {
  const bytes = readFileSync(imagePath);
  const base64 = bytes.toString("base64");
  const ext = imagePath.split(".").pop().toLowerCase();
  const mediaType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

  console.log(`\nAnalizando: ${imagePath}`);
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    system: SYSTEM_PROMPT,
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
        { type: "text", text: "Clasifica el nivel de pigmentación de las patas de este pollo." },
      ],
    }],
  });

  const text = msg.content[0].text;
  const result = JSON.parse(text);
  console.log(`  → Grado: ${result.grado} | Confianza: ${result.confianza}`);
  console.log(`  → ${result.descripcion}`);
  return result;
}

// Uso: pasar rutas de imágenes como argumentos
// Ej: node scripts/test-pigmentacion.mjs foto_pata1.jpg foto_pata2.jpg
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log("Uso: node scripts/test-pigmentacion.mjs <imagen1.jpg> [imagen2.jpg ...]");
  console.log("\nEjemplo rápido (sin imagen — solo verifica conexión a la API):");
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 32,
    messages: [{ role: "user", content: "Responde solo: API OK" }],
  });
  console.log("Conexión API:", msg.content[0].text);
  process.exit(0);
}

for (const img of args) {
  await clasificar(img);
}
