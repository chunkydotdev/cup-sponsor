"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { COASTER } from "./Coaster";
import { ROOM, TABLE } from "./palette";
import { coasterTexture, shadowTexture, softDot, wallTexture, woodTexture } from "./textures";

/** Where the window is, as a unit direction on the floor plane. */
export const WINDOW_DIR = new THREE.Vector3(
  Math.sin(ROOM.windowAzimuth),
  0,
  Math.cos(ROOM.windowAzimuth),
);

const wallHeight = ROOM.wallTop - ROOM.floorY;

/** The round wall, seen from the inside. */
function Walls() {
  const texture = useMemo(
    () => (typeof document === "undefined" ? null : wallTexture(ROOM.wallTop_, ROOM.wallMid, ROOM.wallFoot)),
    [],
  );
  useEffect(() => () => texture?.dispose(), [texture]);

  const geometry = useMemo(
    () => new THREE.CylinderGeometry(ROOM.radius, ROOM.radius, wallHeight, 96, 1, true),
    [],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);

  if (!texture) return null;
  return (
    <mesh geometry={geometry} position={[0, ROOM.floorY + wallHeight / 2, 0]}>
      <meshStandardMaterial map={texture} side={THREE.BackSide} roughness={0.95} metalness={0} />
    </mesh>
  );
}

function Floor() {
  const texture = useMemo(() => (typeof document === "undefined" ? null : woodTexture(ROOM.floor, 0xf1009, 3400)), []);
  useEffect(() => () => texture?.dispose(), [texture]);
  if (!texture) return null;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, ROOM.floorY, 0]}>
      <circleGeometry args={[ROOM.radius, 96]} />
      <meshStandardMaterial map={texture} roughness={0.85} metalness={0.03} />
    </mesh>
  );
}

/** A pedestal table: the cup stands in the middle of the room on this. */
function Table() {
  const texture = useMemo(() => (typeof document === "undefined" ? null : woodTexture(ROOM.table, 0x7ab1e)), []);
  useEffect(() => () => texture?.dispose(), [texture]);
  if (!texture) return null;

  const legTop = -TABLE.topThickness;
  return (
    <group>
      <mesh position={[0, -TABLE.topThickness / 2, 0]}>
        <cylinderGeometry args={[TABLE.topRadius, TABLE.topRadius * 0.99, TABLE.topThickness, 96]} />
        <meshStandardMaterial map={texture} roughness={0.55} metalness={0.05} />
      </mesh>
      <mesh position={[0, (legTop + ROOM.floorY + 0.06) / 2, 0]}>
        <cylinderGeometry args={[0.2, 0.26, legTop - ROOM.floorY - 0.06, 48]} />
        <meshStandardMaterial color="#22160e" roughness={0.6} metalness={0.08} />
      </mesh>
      <mesh position={[0, ROOM.floorY + 0.035, 0]}>
        <cylinderGeometry args={[0.62, 0.66, 0.07, 48]} />
        <meshStandardMaterial color="#1d130c" roughness={0.6} metalness={0.08} />
      </mesh>
    </group>
  );
}

/** The window: the room's only light, and visible as you come round to it. */
function Window() {
  const glow = useMemo(() => (typeof document === "undefined" ? null : softDot()), []);
  useEffect(() => () => glow?.dispose(), [glow]);
  const pos = WINDOW_DIR.clone().multiplyScalar(ROOM.radius - 0.02);
  return (
    <group position={[pos.x, 1.35, pos.z]} rotation={[0, ROOM.windowAzimuth + Math.PI, 0]}>
      <mesh>
        <planeGeometry args={[1.9, 2.7]} />
        <meshBasicMaterial color={ROOM.daylight} toneMapped={false} />
      </mesh>
      {/* Glazing bars, so it reads as a window rather than a glowing slab. */}
      <mesh position={[0, 0, 0.012]}>
        <boxGeometry args={[0.07, 2.7, 0.03]} />
        <meshBasicMaterial color="#20140c" toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.25, 0.012]}>
        <boxGeometry args={[1.9, 0.06, 0.03]} />
        <meshBasicMaterial color="#20140c" toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[2.16, 2.96]} />
        <meshBasicMaterial color="#2a1a10" toneMapped={false} />
      </mesh>
      {/* The spill. Additive, in front of the glass, so the window reads as a
          source rather than a bright rectangle stuck on the wall. */}
      {glow && (
        <mesh position={[0, 0, 0.06]}>
          <planeGeometry args={[3.4, 4.2]} />
          <meshBasicMaterial
            map={glow}
            color={ROOM.daylight}
            transparent
            opacity={0.32}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}
    </group>
  );
}

/** Dust, drifting up through the light. It is what makes the room look lit. */
function Dust({ count = 200 }: { count?: number }) {
  const points = useRef<THREE.Points>(null);
  const sprite = useMemo(() => (typeof document === "undefined" ? null : softDot()), []);
  useEffect(() => () => sprite?.dispose(), [sprite]);

  const { geometry, speeds } = useMemo(() => {
    let seed = 0x0ff33;
    const random = () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const positions = new Float32Array(count * 3);
    const rates = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // Clustered between the window and the cup, where the light is.
      const t = random();
      const along = WINDOW_DIR.clone().multiplyScalar(t * (ROOM.radius - 1));
      positions[i * 3] = along.x + (random() - 0.5) * 2.4;
      positions[i * 3 + 1] = ROOM.floorY + random() * 3;
      positions[i * 3 + 2] = along.z + (random() - 0.5) * 2.4;
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
      if (y > ROOM.floorY + 3) y = ROOM.floorY;
      attr.setY(i, y);
    }
    attr.needsUpdate = true;
  });

  if (!sprite) return null;
  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        map={sprite}
        color={ROOM.daylight}
        size={0.03}
        sizeAttenuation
        transparent
        opacity={0.3}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

function BakedShadow({
  position,
  scale,
  opacity,
}: {
  position: [number, number, number];
  scale: [number, number];
  opacity: number;
}) {
  const texture = useMemo(() => (typeof document === "undefined" ? null : shadowTexture()), []);
  useEffect(() => () => texture?.dispose(), [texture]);
  if (!texture) return null;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={position} scale={[...scale, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

/** Both shadows fall directly away from the window. */
const AWAY = WINDOW_DIR.clone().multiplyScalar(-0.16);

export function CoasterShadow() {
  return <BakedShadow position={[AWAY.x, 0.004, AWAY.z]} scale={[2.3, 2.3]} opacity={0.85} />;
}

export function CupShadow() {
  return (
    <BakedShadow
      position={[AWAY.x * 0.4, COASTER.height + 0.002, AWAY.z * 0.4]}
      scale={[1.08, 1.08]}
      opacity={0.7}
    />
  );
}

/** The coaster the cup stands on. */
export function Coaster() {
  const texture = useMemo(() => (typeof document === "undefined" ? null : coasterTexture()), []);
  useEffect(() => () => texture?.dispose(), [texture]);
  if (!texture) return null;
  return (
    <mesh position={[0, COASTER.height / 2, 0]}>
      <cylinderGeometry args={[COASTER.radius, COASTER.radius * 0.97, COASTER.height, 72]} />
      <meshStandardMaterial map={texture} roughness={0.92} metalness={0} />
    </mesh>
  );
}

export function Room() {
  return (
    <group>
      <Walls />
      <Floor />
      <Table />
      <Window />
      <Dust />
    </group>
  );
}
