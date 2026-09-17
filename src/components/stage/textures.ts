"use client";

import * as THREE from "three";

/** Seeded noise, so the room is identical on every load and in every shot. */
export function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One soft-edged blob, painted into a gradient. */
function blob(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha: number) {
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
 * The wall, wrapped round the room: u runs all the way about, v is height. A
 * vertical gradient for the light, then plaster over it — soft mottling and a
 * fine grain — because a wall with no surface at all reads as a backdrop.
 * Anything directional still has to come from the actual light, now that the
 * camera walks around the room. The tile is mirrored round the room rather
 * than repeated, which is what hides the seam.
 */
export function wallTexture(top: string, mid: string, foot: string) {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, top);
  g.addColorStop(0.3, mid);
  g.addColorStop(0.74, mid);
  g.addColorStop(0.95, foot);
  g.addColorStop(1, "#080503");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  const random = mulberry32(0x9a11);
  for (let i = 0; i < 90; i++) {
    const shade = random();
    blob(
      ctx,
      random() * w,
      random() * h,
      60 + random() * 220,
      shade > 0.5 ? "#7a5232" : "#1e120a",
      0.3,
    );
  }
  ctx.globalAlpha = 0.06;
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = random() > 0.5 ? "#000" : "#c9a37c";
    ctx.fillRect(random() * w, random() * h, 1 + Math.round(random()), 1);
  }
  ctx.globalAlpha = 1;

  const tex = toTexture(canvas);
  tex.wrapS = THREE.MirroredRepeatWrapping;
  tex.repeat.set(6, 1);
  return tex;
}

/** Wood: grain and a little colour variation, no baked light. */
export function woodTexture(base: string, seed = 0xc0ffee, strokes = 3000) {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  const random = mulberry32(seed);
  ctx.globalAlpha = 0.09;
  for (let i = 0; i < strokes; i++) {
    const y = random() * size;
    ctx.fillStyle = random() > 0.5 ? "#000" : "#caa077";
    ctx.fillRect(random() * size, y, 40 + random() * 150, 1 + Math.round(random()));
  }
  ctx.globalAlpha = 1;
  return toTexture(canvas);
}

/**
 * A puff with no core at all — for steam. The dot sprite has a bright centre,
 * and a plume of bright centres is a plume of dots however you blend it.
 */
export function softPuff() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,0.5)");
  g.addColorStop(0.3, "rgba(255,255,255,0.28)");
  g.addColorStop(0.65, "rgba(255,255,255,0.07)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return toTexture(canvas);
}

/** Fades along its length: full at the window end, gone at the table. */
export function shaftTexture() {
  const w = 8;
  const h = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.45, "rgba(255,255,255,0.55)");
  g.addColorStop(0.85, "rgba(255,255,255,0.12)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  return toTexture(canvas);
}

/** A soft round sprite — the dust motes use it. */
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

/**
 * Shadows. Baked rather than rendered: a shadow pass renders every mesh in its
 * frustum with an override material, which caught the room and stamped hard
 * edges onto the table. Nothing here moves, so a texture is enough.
 *
 * The dark core is deliberately wider than the cup's base: the part of a
 * contact shadow you actually see is the rim just outside it.
 */
export function shadowTexture() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  blob(ctx, size * 0.5, size * 0.5, size * 0.5, "rgba(12,7,3,0.5)", 1);
  blob(ctx, size * 0.5, size * 0.5, size * 0.3, "rgba(4,2,1,0.92)", 1);
  blob(ctx, size * 0.5, size * 0.5, size * 0.24, "rgba(0,0,0,1)", 1);
  return toTexture(canvas);
}

/** Cork, for the coaster: warm, speckled, a shade darker at the rim. */
export function coasterTexture() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#9c6b3c";
  ctx.fillRect(0, 0, size, size);

  const random = mulberry32(0xc0a57e);
  for (let i = 0; i < 5200; i++) {
    const r = 1.5 + random() * 5;
    const shade = random();
    ctx.fillStyle =
      shade > 0.72 ? "rgba(58,34,14,0.5)" : shade > 0.4 ? "rgba(196,146,92,0.42)" : "rgba(120,80,42,0.35)";
    ctx.beginPath();
    ctx.ellipse(random() * size, random() * size, r, r * (0.6 + random() * 0.8), random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  const edge = ctx.createRadialGradient(size / 2, size / 2, size * 0.22, size / 2, size / 2, size * 0.5);
  edge.addColorStop(0, "rgba(0,0,0,0)");
  edge.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, size, size);
  return toTexture(canvas);
}

/**
 * The glass. Sky read through a window is blown out at the top and picks up a
 * little warmth from the ground near the sill, which is what stops it looking
 * like a lamp panel.
 */
export function paneTexture() {
  const w = 64;
  const h = 512;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.35, "#f2f7ff");
  g.addColorStop(0.72, "#e4edff");
  g.addColorStop(0.92, "#f6eedd");
  g.addColorStop(1, "#ffe9c6");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  return toTexture(canvas);
}

/** A soft wool rug: mottled warm tones and one quiet border, no bullseye. */
export function rugTexture() {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const random = mulberry32(0x6009);

  ctx.fillStyle = "#7a4a33";
  ctx.fillRect(0, 0, size, size);

  // Big soft patches, so the wool has depth without turning into a pattern.
  for (let i = 0; i < 90; i++) {
    const shade = random();
    blob(
      ctx,
      random() * size,
      random() * size,
      size * (0.05 + random() * 0.14),
      shade > 0.55 ? "#8f5b3e" : shade > 0.25 ? "#69402c" : "#a06c49",
      0.35,
    );
  }

  // One quiet border, the way a rug is bound at the edge.
  ctx.strokeStyle = "rgba(48,28,18,0.5)";
  ctx.lineWidth = size * 0.012;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.44, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = 0.12;
  for (let i = 0; i < 11000; i++) {
    ctx.fillStyle = random() > 0.5 ? "#000" : "#d6a877";
    ctx.fillRect(random() * size, random() * size, 2, 2);
  }
  ctx.globalAlpha = 1;

  const edge = ctx.createRadialGradient(size / 2, size / 2, size * 0.4, size / 2, size / 2, size * 0.5);
  edge.addColorStop(0, "rgba(0,0,0,0)");
  edge.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, size, size);
  return toTexture(canvas);
}

/** Heavy linen, for the curtains. */
export function clothTexture(base: string) {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  const random = mulberry32(0xc1071);
  ctx.globalAlpha = 0.07;
  for (let i = 0; i < 5200; i++) {
    ctx.fillStyle = random() > 0.5 ? "#000" : "#fff";
    const vertical = random() > 0.5;
    ctx.fillRect(random() * size, random() * size, vertical ? 1 : 3 + random() * 6, vertical ? 3 + random() * 6 : 1);
  }
  ctx.globalAlpha = 1;
  return toTexture(canvas);
}
