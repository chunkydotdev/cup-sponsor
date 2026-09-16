"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useCoffeeTexture } from "./useCoffeeTexture";
import { useLogoTexture } from "./useLogoTexture";

/**
 * The cup, in units of its own rim radius. The rim sits at y = 0 and the body
 * hangs below it, so `MUG_BASE_Y` is how far to lift it to stand it on a table.
 */
const OUTER: [number, number][] = [
  [0.0, -2.3],
  [0.74, -2.3],
  [0.8, -2.288],
  [0.825, -2.255],
  [0.838, -2.2],
  [0.858, -2.0],
  [0.888, -1.6],
  [0.922, -1.1],
  [0.955, -0.6],
  [0.982, -0.18],
  [0.996, -0.04],
  [1.0, 0.0],
];

const INNER: [number, number][] = [
  [0.99, 0.024],
  [0.955, 0.03],
  [0.928, 0.014],
  [0.918, -0.06],
  [0.895, -0.5],
  [0.862, -1.1],
  [0.83, -1.7],
  [0.795, -2.1],
  [0.74, -2.2],
  [0.62, -2.24],
  [0.0, -2.26],
];

export const MUG_BASE_Y = -2.3;

/** The printable band — where a mug is actually printed. */
export const PRINT = { top: -0.55, bottom: -1.85 };

/** The handle, as a tube that leaves the wall and comes back to it. */
const HANDLE_PATH: [number, number][] = [
  [0.9, -0.58],
  [1.32, -0.7],
  [1.47, -1.05],
  [1.38, -1.42],
  [1.02, -1.62],
  [0.86, -1.64],
];
const HANDLE_RADIUS = 0.092;

/** Outer radius of the wall at a given height — where the print has to sit. */
function outerRadiusAt(y: number) {
  const pts = OUTER.slice(1);
  if (y <= pts[0][1]) return pts[0][0];
  for (let i = 1; i < pts.length; i++) {
    const [r0, y0] = pts[i - 1];
    const [r1, y1] = pts[i];
    if (y <= y1) return r0 + ((y - y0) / (y1 - y0)) * (r1 - r0);
  }
  return pts[pts.length - 1][0];
}

function Ceramic({ opacity }: { opacity: number }) {
  return (
    <meshPhysicalMaterial
      color="#f5f3ef"
      roughness={0.26}
      metalness={0}
      clearcoat={0.9}
      clearcoatRoughness={0.14}
      side={THREE.DoubleSide}
      transparent={opacity < 1}
      opacity={opacity}
    />
  );
}

export function Mug({ logoUrl, opacity = 1 }: { logoUrl: string | null; opacity?: number }) {
  const body = useMemo(
    () => new THREE.LatheGeometry([...OUTER, ...INNER].map(([x, y]) => new THREE.Vector2(x, y)), 128),
    [],
  );

  const handle = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(HANDLE_PATH.map(([x, y]) => new THREE.Vector3(x, y, 0)));
    return new THREE.TubeGeometry(curve, 64, HANDLE_RADIUS, 18, false);
  }, []);

  const printHeight = PRINT.top - PRINT.bottom;
  // Float the print a hair off the ceramic so it never fights the wall for depth.
  const topR = outerRadiusAt(PRINT.top) + 0.004;
  const bottomR = outerRadiusAt(PRINT.bottom) + 0.004;
  // The wrap canvas has to be this shape or the logo comes out stretched.
  const bandAspect = (Math.PI * (topR + bottomR)) / printHeight;

  const logo = useLogoTexture(logoUrl, bandAspect);
  const coffee = useCoffeeTexture();

  return (
    <group>
      <mesh geometry={body}>
        <Ceramic opacity={opacity} />
      </mesh>

      <mesh geometry={handle}>
        <Ceramic opacity={opacity} />
      </mesh>

      {/* Coffee. The mesh waits for its texture: a material compiled without a
          map never grows one. */}
      {coffee && (
        <mesh position={[0, -0.24, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.9, 64]} />
          <meshPhysicalMaterial
            map={coffee}
            roughness={0.33}
            metalness={0.02}
            clearcoat={0.9}
            clearcoatRoughness={0.28}
            transparent={opacity < 1}
            opacity={opacity}
          />
        </mesh>
      )}

      {/* The sponsored band. The centre of the texture faces the camera. */}
      {logo && (
        <mesh position={[0, (PRINT.top + PRINT.bottom) / 2, 0]} rotation={[0, Math.PI, 0]}>
          <cylinderGeometry args={[topR, bottomR, printHeight, 128, 1, true]} />
          <meshStandardMaterial
            map={logo}
            transparent
            opacity={opacity}
            roughness={0.4}
            metalness={0}
            polygonOffset
            polygonOffsetFactor={-2}
            side={THREE.FrontSide}
          />
        </mesh>
      )}
    </group>
  );
}
