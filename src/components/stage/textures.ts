"use client";

import * as THREE from "three";

/** Seeded noise, so the room is identical on every load and in every shot. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One soft-edged blob, painted into a gradient. */
function blob(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  alpha: number,
) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.globalAlpha = 1;
}

function toTexture(canvas: HTMLCanvasElement) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/**
 * The back wall: near-black, with the window's light landing on it as a soft
 * leaning rectangle. Baking it beats lighting it — it costs nothing and it is
 * the shape that sells the room.
 */
export function wallTexture(base: string, lit: string) {
  const w = 1024;
  const h = 640;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  // Broad warmth spilling in from the left. The camera only ever sees the
  // middle of this plane, so everything is aimed at u 0.28..0.72, v 0.42..0.96.
  blob(ctx, w * 0.3, h * 0.62, w * 0.42, lit, 0.62);
  blob(ctx, w * 0.56, h * 0.7, w * 0.3, lit, 0.24);

  // The window itself, sheared the way a low sun throws it.
  ctx.save();
  ctx.transform(1, 0.2, 0, 1, 0, -h * 0.1);
  ctx.filter = "blur(22px)";
  ctx.globalAlpha = 0.62;
  ctx.fillStyle = lit;
  ctx.fillRect(w * 0.29, h * 0.46, w * 0.115, h * 0.42);
  ctx.fillRect(w * 0.425, h * 0.46, w * 0.095, h * 0.42);
  ctx.restore();
  ctx.filter = "none";
  ctx.globalAlpha = 1;

  // The floor line is darker than the wall above it.
  const foot = ctx.createLinearGradient(0, h * 0.88, 0, h);
  foot.addColorStop(0, "rgba(0,0,0,0)");
  foot.addColorStop(1, "rgba(0,0,0,0.85)");
  ctx.fillStyle = foot;
  ctx.fillRect(0, h * 0.88, w, h * 0.12);

  return toTexture(canvas);
}

/** The tabletop: dark wood, brighter where the window reaches it. */
export function tableTexture(base: string, lit: string) {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  blob(ctx, size * 0.3, size * 0.34, size * 0.46, lit, 0.62);
  blob(ctx, size * 0.62, size * 0.52, size * 0.3, lit, 0.22);

  // A little grain, so it is not a flat wash under the bloom.
  const random = mulberry32(0xc0ffee);
  ctx.globalAlpha = 0.06;
  for (let i = 0; i < 2600; i++) {
    const y = random() * size;
    ctx.fillStyle = random() > 0.5 ? "#000" : "#c79a6a";
    ctx.fillRect(random() * size, y, 40 + random() * 90, 1);
  }
  ctx.globalAlpha = 1;

  const edge = ctx.createRadialGradient(size / 2, size / 2, size * 0.2, size / 2, size / 2, size * 0.52);
  edge.addColorStop(0, "rgba(0,0,0,0)");
  edge.addColorStop(1, "rgba(0,0,0,0.9)");
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, size, size);

  return toTexture(canvas);
}

/** A soft round sprite — the light shaft and the dust both use it. */
export function softDot() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.4)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return toTexture(canvas);
}

/** The beam itself: bright along its length, feathered at both edges. */
export function shaftTexture() {
  const w = 256;
  const h = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const across = ctx.createLinearGradient(0, 0, w, 0);
  across.addColorStop(0, "rgba(255,255,255,0)");
  across.addColorStop(0.5, "rgba(255,255,255,0.85)");
  across.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = across;
  ctx.fillRect(0, 0, w, h);
  const along = ctx.createLinearGradient(0, 0, 0, h);
  along.addColorStop(0, "rgba(0,0,0,0)");
  along.addColorStop(0.25, "rgba(0,0,0,0.25)");
  along.addColorStop(1, "rgba(0,0,0,1)");
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = along;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "source-over";
  return toTexture(canvas);
}
