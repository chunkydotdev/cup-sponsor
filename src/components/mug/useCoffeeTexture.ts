"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";

/**
 * Coffee is not a flat disc — the wall shades its edge and the middle catches
 * the window. A radial gradient does the whole job.
 */
export function useCoffeeTexture() {
  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    const g = ctx.createRadialGradient(size * 0.42, size * 0.36, size * 0.04, size / 2, size / 2, size / 2);
    g.addColorStop(0, "#5a3a22");
    g.addColorStop(0.45, "#3a2214");
    g.addColorStop(0.82, "#23140b");
    g.addColorStop(1, "#150c06");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    // The pale crema ring that always clings to the wall.
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = "#8a5f36";
    ctx.lineWidth = size * 0.035;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.455, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  useEffect(() => () => texture?.dispose(), [texture]);

  return texture;
}
