import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
};

/** Logos land in public/logos and are referenced by path from then on. */
export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("logo");
  if (!(file instanceof File)) return NextResponse.json({ error: "No logo uploaded." }, { status: 400 });
  const ext = ALLOWED[file.type];
  if (!ext) return NextResponse.json({ error: "Logo must be PNG, JPG, WEBP or SVG." }, { status: 415 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Logo must be under 4 MB." }, { status: 413 });

  const name = `${randomUUID()}${ext}`;
  const dir = path.join(process.cwd(), "public", "logos");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ logoPath: `/logos/${name}` });
}
