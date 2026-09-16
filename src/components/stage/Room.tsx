"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ROOM } from "./palette";
import { shaftTexture, softDot, tableTexture, wallTexture } from "./textures";

/** The back wall, with the window's light already on it. */
function Wall() {
  const texture = useMemo(() => (typeof document === "undefined" ? null : wallTexture(ROOM.wall, ROOM.wallLit)), []);
  useEffect(() => () => texture?.dispose(), [texture]);
  if (!texture) return null;
  return (
    <mesh position={[0, 2.1, -3.4]}>
      <planeGeometry args={[16, 8]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

/** The tabletop the cup stands on. */
function Table() {
  const texture = useMemo(() => (typeof document === "undefined" ? null : tableTexture(ROOM.table, ROOM.tableLit)), []);
  useEffect(() => () => texture?.dispose(), [texture]);
  if (!texture) return null;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.4]} receiveShadow>
      <planeGeometry args={[14, 11]} />
      <meshStandardMaterial map={texture} roughness={0.72} metalness={0.05} />
    </mesh>
  );
}

/** The beam coming in over the cup's left shoulder. */
function LightShaft() {
  const texture = useMemo(() => (typeof document === "undefined" ? null : shaftTexture()), []);
  useEffect(() => () => texture?.dispose(), [texture]);
  if (!texture) return null;
  return (
    <group position={[-1.95, 1.55, -0.9]} rotation={[0, 0.42, -0.34]}>
      <mesh>
        <planeGeometry args={[1.7, 4.6]} />
        <meshBasicMaterial
          map={texture}
          color={ROOM.shaft}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh rotation={[0, Math.PI / 2.4, 0]}>
        <planeGeometry args={[1.3, 4.6]} />
        <meshBasicMaterial
          map={texture}
          color={ROOM.shaft}
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/** Seeded, so the room looks the same every load — and in every screenshot. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Dust, drifting up through the beam. It is what makes the light look real. */
function Dust({ count = 110 }: { count?: number }) {
  const points = useRef<THREE.Points>(null);
  const sprite = useMemo(() => (typeof document === "undefined" ? null : softDot()), []);
  useEffect(() => () => sprite?.dispose(), [sprite]);

  const { geometry, speeds } = useMemo(() => {
    const random = mulberry32(0x0ff33);
    const positions = new Float32Array(count * 3);
    const rates = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = -2.4 + random() * 2.9;
      positions[i * 3 + 1] = random() * 2.7;
      positions[i * 3 + 2] = -1.6 + random() * 2.6;
      rates[i] = 0.01 + random() * 0.03;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return { geometry: geo, speeds: rates };
  }, [count]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, delta) => {
    const attr = points.current?.geometry.getAttribute("position") as THREE.BufferAttribute | undefined;
    if (!attr) return;
    for (let i = 0; i < count; i++) {
      let y = attr.getY(i) + speeds[i] * delta;
      if (y > 2.7) y = 0;
      attr.setY(i, y);
      attr.setX(i, attr.getX(i) + Math.sin((y + i) * 1.6) * delta * 0.006);
    }
    attr.needsUpdate = true;
  });

  if (!sprite) return null;
  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        map={sprite}
        color={ROOM.daylight}
        size={0.022}
        sizeAttenuation
        transparent
        opacity={0.24}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

export function Room() {
  return (
    <group>
      <Wall />
      <Table />
      <LightShaft />
      <Dust />
    </group>
  );
}
