import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

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

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const form = await req.formData();
    const file = form.get("imagen") as File | null;
    if (!file) return NextResponse.json({ error: "Imagen requerida" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mediaType = (file.type || "image/jpeg") as "image/jpeg" | "image/png" | "image/webp";

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
            { type: "text", text: "Clasifica el nivel de pigmentación de las patas de este pollo." },
          ],
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const result = JSON.parse(text);

    if (typeof result.grado !== "number" || result.grado < 0 || result.grado > 5) {
      throw new Error("Grado fuera de rango");
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Error clasificando pigmentación:", err);
    return NextResponse.json({ error: "No se pudo clasificar la imagen" }, { status: 500 });
  }
}
