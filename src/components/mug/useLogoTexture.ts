"use client";

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";

/** Pixels around the full circumference of the mug. */
const WRAP_W = 2048;
/** How much of the way around the mug the print is allowed to run. */
const PRINT_W = 0.3;

/**
 * The canvas has to have the same shape as the band it is painted onto, or the
 * logo comes out stretched. `bandAspect` is circumference ÷ band height.
 */
function wrapHeight(bandAspect: number) {
  return Math.round(WRAP_W / bandAspect);
}

function blankWrap(bandAspect: number) {
  const canvas = document.createElement("canvas");
  canvas.width = WRAP_W;
  canvas.height = wrapHeight(bandAspect);
  return canvas;
}

function toTexture(canvas: HTMLCanvasElement) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  // The seam sits at the back of the mug; the centre of the canvas faces us.
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

function drawPlaceholder(ctx: CanvasRenderingContext2D, WRAP_H: number) {
  const w = WRAP_W * PRINT_W;
  const h = WRAP_H * 0.62;
  const x = (WRAP_W - w) / 2;
  const y = (WRAP_H - h) / 2;

  ctx.strokeStyle = "rgba(90, 96, 110, 0.55)";
  ctx.lineWidth = 7;
  ctx.setLineDash([26, 22]);
  ctx.strokeRect(x, y, w, h);

  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(90, 96, 110, 0.72)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `600 ${Math.round(h * 0.17)}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
  ctx.fillText("YOUR LOGO", WRAP_W / 2, y + h * 0.42);
  ctx.font = `500 ${Math.round(h * 0.1)}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
  ctx.fillText("tomorrow morning", WRAP_W / 2, y + h * 0.65);
}

function drawLogo(ctx: CanvasRenderingContext2D, img: HTMLImageElement, WRAP_H: number) {
  const maxW = WRAP_W * PRINT_W;
  const maxH = WRAP_H * 0.72;
  const scale = Math.min(maxW / img.width, maxH / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, (WRAP_W - w) / 2, (WRAP_H - h) / 2, w, h);
}

/**
 * Bakes the sponsor logo into a full-wrap texture so it sits on the front of
 * the mug and curves with it. Nothing else on the band is painted, so the
 * ceramic shows through everywhere else. Until a logo loads, the dashed
 * placeholder stands in — which is also the empty state of the whole product.
 */
export function useLogoTexture(logoUrl: string | null, bandAspect: number) {
  const placeholder = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = blankWrap(bandAspect);
    drawPlaceholder(canvas.getContext("2d")!, canvas.height);
    return toTexture(canvas);
  }, [bandAspect]);

  // Tagged with the url it was drawn from, so a texture is never shown for a
  // logo that has since been replaced.
  const [loaded, setLoaded] = useState<{ url: string; texture: THREE.CanvasTexture } | null>(null);

  useEffect(() => {
    if (!logoUrl || typeof document === "undefined") return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = blankWrap(bandAspect);
      drawLogo(canvas.getContext("2d")!, img, canvas.height);
      setLoaded({ url: logoUrl, texture: toTexture(canvas) });
    };
    img.src = logoUrl;
    return () => {
      img.onload = null;
    };
  }, [logoUrl, bandAspect]);

  useEffect(() => () => loaded?.texture.dispose(), [loaded]);
  useEffect(() => () => placeholder?.dispose(), [placeholder]);

  return loaded?.url === logoUrl ? loaded.texture : placeholder;
}
