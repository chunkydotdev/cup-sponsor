"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { SceneConfig } from "@/lib/scene";
import { useCoffeeTexture } from "./useCoffeeTexture";
import { useLogoTexture } from "./useLogoTexture";

/**
 * Mug profile, in units of the outer rim radius. The rim sits at y = 0 and the
 * body hangs below it, so placing the mug means placing its rim. The outer wall
 * runs base-first up to the rim, then the lip turns and the inner wall drops.
 */
const OUTER: [number, number][] = [
  [0.0, -2.56],
  [0.7, -2.56],
  [0.755, -2.545],
  [0.775, -2.51],
  [0.785, -2.45],
  [0.795, -2.3],
  [0.83, -1.9],
  [0.875, -1.4],
  [0.92, -0.9],
  [0.955, -0.4],
  [0.985, -0.08],
  [0.997, -0.02],
  [1.0, 0.0],
];

const INNER: [number, number][] = [
  [0.99, 0.022],
  [0.955, 0.028],
  [0.93, 0.012],
  [0.92, -0.06],
  [0.9, -0.45],
  [0.855, -1.1],
  [0.8, -1.8],
  [0.745, -2.3],
  [0.69, -2.42],
  [0.6, -2.46],
  [0.0, -2.48],
];

/** The handle, measured off the photograph: it has to cover the real one. */
const HANDLE = { x: 0.7, y: -1.02, major: 0.45, tube: 0.115 };

/** Outer radius of the wall at a given height — where the print has to sit. */
function outerRadiusAt(y: number) {
  const pts = [...OUTER].slice(1);
  if (y <= pts[0][1]) return pts[0][0];
  for (let i = 1; i < pts.length; i++) {
    const [r0, y0] = pts[i - 1];
    const [r1, y1] = pts[i];
    if (y <= y1) return r0 + ((y - y0) / (y1 - y0)) * (r1 - r0);
  }
  return pts[pts.length - 1][0];
}

export function Mug({
  logoUrl,
  cfg,
  opacity = 1,
}: {
  logoUrl: string | null;
  cfg: SceneConfig;
  /** Ghost the cup to line it up against the real one. See /calibrate. */
  opacity?: number;
}) {
  const ghost = opacity < 1;
  const drift = useRef<THREE.Group>(null);
  const logo = useLogoTexture(logoUrl);
  const coffee = useCoffeeTexture();

  const body = useMemo(
    () => new THREE.LatheGeometry([...OUTER, ...INNER].map(([x, y]) => new THREE.Vector2(x, y)), 96),
    [],
  );

  const printHeight = cfg.printTop - cfg.printBottom;
  // Float the print a hair off the ceramic so it never fights the wall for depth.
  const printTopR = outerRadiusAt(cfg.printTop) + 0.004;
  const printBottomR = outerRadiusAt(cfg.printBottom) + 0.004;

  // A slow drift, so the cup reads as an object rather than a sticker.
  useFrame(({ clock }) => {
    if (!drift.current) return;
    const t = clock.getElapsedTime();
    drift.current.rotation.y = Math.sin(t * 0.35) * 0.1;
  });

  return (
    <group rotation={[0, 0, (cfg.rollDeg * Math.PI) / 180]}>
      <group ref={drift}>
        <mesh geometry={body}>
          <meshPhysicalMaterial
            color="#f4f2ee"
            roughness={0.3}
            metalness={0}
            clearcoat={0.85}
            clearcoatRoughness={0.16}
            side={THREE.DoubleSide}
            transparent={ghost}
            opacity={opacity}
          />
        </mesh>

        {/* The handle. Most of the ring is buried in the wall; only the part
            that clears the silhouette is ever seen, which is how a real one
            reads too. */}
        <mesh position={[HANDLE.x, HANDLE.y, 0]}>
          <torusGeometry args={[HANDLE.major, HANDLE.tube, 24, 64]} />
          <meshPhysicalMaterial
            color="#f4f2ee"
            roughness={0.3}
            metalness={0}
            clearcoat={0.85}
            clearcoatRoughness={0.16}
            transparent={ghost}
            opacity={opacity}
          />
        </mesh>

        {/* Coffee, because the cup is never empty in the photo. The mesh waits
            for its texture: a material compiled without a map never grows one. */}
        {coffee && (
          <mesh position={[0, -0.16, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.905, 64]} />
            <meshPhysicalMaterial
              map={coffee}
              roughness={0.33}
              metalness={0.02}
              clearcoat={0.9}
              clearcoatRoughness={0.28}
              transparent={ghost}
              opacity={opacity}
            />
          </mesh>
        )}

        {/* The sponsored band. The centre of the texture faces the camera. */}
        {logo && (
          <mesh position={[0, (cfg.printTop + cfg.printBottom) / 2, 0]} rotation={[0, Math.PI, 0]}>
            <cylinderGeometry args={[printTopR, printBottomR, printHeight, 96, 1, true]} />
            <meshStandardMaterial
              map={logo}
              transparent
              opacity={opacity}
              roughness={0.42}
              metalness={0}
              polygonOffset
              polygonOffsetFactor={-2}
              side={THREE.FrontSide}
            />
          </mesh>
        )}
      </group>
    </group>
  );
}
