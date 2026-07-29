import { mkdir, rm, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

// Stored outside `public/` because Next.js snapshots the public folder at
// server startup, so files written at runtime (uploaded photos) would 404.
// They are served instead via /api/uploads/[...path].
const UPLOAD_ROOT = path.join(process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads"), "inspecciones");

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

// Cap the longest side and re-encode as JPEG so multi-MB camera photos
// don't fill up disk / the body-size limit.
const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 75;

export async function saveInspectionPhoto(inspeccionId: string, file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (!ALLOWED_TYPES.has(file.type)) return null;

  const dir = path.join(UPLOAD_ROOT, inspeccionId);
  await mkdir(dir, { recursive: true });

  const original = Buffer.from(await file.arrayBuffer());

  let buffer: Buffer<ArrayBufferLike> = original;
  let ext = ".jpg";
  try {
    buffer = await sharp(original)
      .rotate()
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer();
  } catch {
    // Fall back to the original file if it can't be processed (e.g. unsupported HEIC build).
    buffer = original;
    ext = path.extname(file.name) || ".jpg";
  }

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const filePath = path.join(dir, filename);

  await writeFile(filePath, buffer);

  return `/api/uploads/inspecciones/${inspeccionId}/${filename}`;
}

export async function deleteInspeccionPhotos(inspeccionId: string): Promise<void> {
  await rm(path.join(UPLOAD_ROOT, inspeccionId), { recursive: true, force: true });
}

// --- Evidencia del módulo de apilamiento y ventilación (fotos + videos cortos) ---

const APILAMIENTO_ROOT = path.join(
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads"),
  "apilamiento"
);

const VIDEO_TYPES = new Set(["video/mp4", "video/quicktime", "video/webm", "video/3gpp", "video/x-matroska"]);

/** Tope por video: los videos NO se recomprimen, así que se acotan en tamaño. */
export const MAX_VIDEO_BYTES = 25 * 1024 * 1024; // 25 MB
export const MAX_FOTO_BYTES = 15 * 1024 * 1024; // 15 MB antes de recomprimir

const EXT_POR_TIPO: Record<string, string> = {
  "video/mp4": ".mp4",
  "video/quicktime": ".mov",
  "video/webm": ".webm",
  "video/3gpp": ".3gp",
  "video/x-matroska": ".mkv",
};

export type MediaGuardada = { path: string; tipo: "FOTO" | "VIDEO"; bytes: number };

/**
 * Guarda una foto o un video de un registro de apilamiento. Las fotos se reescalan y
 * recomprimen (igual que las de inspección); los videos se guardan tal cual, con tope de
 * tamaño. Devuelve null si el archivo no es de un tipo admitido o excede el tope.
 */
export async function saveApilamientoMedia(registroId: string, file: File): Promise<MediaGuardada | null> {
  if (!file || file.size === 0) return null;

  const esVideo = VIDEO_TYPES.has(file.type);
  const esFoto = ALLOWED_TYPES.has(file.type);
  if (!esVideo && !esFoto) return null;
  if (esVideo && file.size > MAX_VIDEO_BYTES) return null;
  if (esFoto && file.size > MAX_FOTO_BYTES) return null;

  const dir = path.join(APILAMIENTO_ROOT, registroId);
  await mkdir(dir, { recursive: true });

  const original = Buffer.from(await file.arrayBuffer());
  let buffer: Buffer<ArrayBufferLike> = original;
  let ext: string;

  if (esVideo) {
    ext = EXT_POR_TIPO[file.type] ?? path.extname(file.name) ?? ".mp4";
  } else {
    ext = ".jpg";
    try {
      buffer = await sharp(original)
        .rotate()
        .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: JPEG_QUALITY })
        .toBuffer();
    } catch {
      buffer = original;
      ext = path.extname(file.name) || ".jpg";
    }
  }

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  await writeFile(path.join(dir, filename), buffer);

  return {
    path: `/api/uploads/apilamiento/${registroId}/${filename}`,
    tipo: esVideo ? "VIDEO" : "FOTO",
    bytes: buffer.length,
  };
}
