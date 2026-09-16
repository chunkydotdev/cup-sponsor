import "server-only";
import fs from "node:fs";
import path from "node:path";

/**
 * Everything the running site writes or is given: the sponsor logos people
 * upload, and the morning photographs.
 *
 * None of it can live in `public/`. Next serves that directory from a manifest
 * built at compile time, so in production a file dropped in afterwards is
 * listed by the page and then 404s — a blank frame on the wall, and a sponsor
 * logo that never appears. It all lives beside the database instead, on the one
 * volume, and is served by /api/media.
 */
export const MEDIA_DIR = process.env.CUPSPONSOR_DATA_DIR ?? path.join(process.cwd(), "data");
export const LOGO_DIR = path.join(MEDIA_DIR, "logos");
export const PHOTO_DIR = path.join(MEDIA_DIR, "photo");
export const GALLERY_DIR = path.join(PHOTO_DIR, "gallery");

export const TODAY_SRC = "/api/media/photo/today.jpg";

const IMAGE = /\.(jpe?g|png|webp|svg)$/i;

/**
 * First run has an empty volume, so the photographs shipped in the repo are
 * copied across once. After that the volume is the truth and the copies in
 * `public/` are never read again.
 */
function seed() {
  if (fs.existsSync(PHOTO_DIR)) return;
  const shipped = path.join(process.cwd(), "public", "photo");
  fs.mkdirSync(GALLERY_DIR, { recursive: true });
  if (!fs.existsSync(shipped)) return;
  fs.cpSync(shipped, PHOTO_DIR, { recursive: true });
}

export function ensureMedia() {
  fs.mkdirSync(LOGO_DIR, { recursive: true });
  seed();
}

/** Every past morning, oldest first. Name them by date and they hang in order. */
export function listGallery(): string[] {
  ensureMedia();
  try {
    return fs
      .readdirSync(GALLERY_DIR)
      .filter((name) => IMAGE.test(name))
      .sort()
      .map((name) => `/api/media/photo/gallery/${encodeURIComponent(name)}`);
  } catch {
    return [];
  }
}

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

export function contentType(file: string) {
  return TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream";
}

/**
 * Resolve a request path inside MEDIA_DIR, or null. Everything is rejected that
 * does not end up genuinely underneath it, so `../` cannot walk out.
 */
export function resolveMedia(segments: string[]): string | null {
  const root = path.resolve(MEDIA_DIR);
  const target = path.resolve(root, ...segments);
  if (target !== root && !target.startsWith(root + path.sep)) return null;
  const first = segments[0];
  if (first !== "logos" && first !== "photo") return null;
  if (!IMAGE.test(target)) return null;
  return target;
}
