import fs from "node:fs";
import path from "node:path";

/** This morning's photograph — the one being sold. */
export const PHOTO_SRC = "/photo/today.jpg";

const GALLERY_DIR = path.join(process.cwd(), "public", "photo", "gallery");

/**
 * Every past morning, hung around the room. Drop a file in
 * `public/photo/gallery/` and it appears on a wall; name them by date and they
 * hang in order. Server-side only — the page reads the folder and passes the
 * list down.
 */
export function listGallery(): string[] {
  try {
    return fs
      .readdirSync(GALLERY_DIR)
      .filter((name) => /\.(jpe?g|png|webp)$/i.test(name))
      .sort()
      .map((name) => `/photo/gallery/${name}`);
  } catch {
    return [];
  }
}
