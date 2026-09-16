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
 * vertical gradient and nothing else — anything directional has to come from
 * the actual light now that the camera walks around the room.
 */
export function wallTexture(top: string, mid: string, foot: string) {
  const w = 8;
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
  return toTexture(canvas);
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
