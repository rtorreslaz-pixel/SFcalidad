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
