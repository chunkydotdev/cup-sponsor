import fs from "node:fs";
import { NextResponse } from "next/server";
import { contentType, ensureMedia, resolveMedia } from "@/lib/media";

/**
 * Serves the uploaded logos and the morning photographs off the data volume.
 * They cannot be served from `public/`: that is a build-time manifest, so
 * anything written afterwards would 404 in production.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  ensureMedia();
  const { path: segments } = await params;
  const file = resolveMedia(segments);
  if (!file || !fs.existsSync(file)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const body = await fs.promises.readFile(file);
  return new NextResponse(new Uint8Array(body), {
    headers: {
      "content-type": contentType(file),
      // Logo names are random and never reused; today.jpg is replaced daily.
      "cache-control": segments[0] === "logos" ? "public, max-age=31536000, immutable" : "public, max-age=60",
    },
  });
}
