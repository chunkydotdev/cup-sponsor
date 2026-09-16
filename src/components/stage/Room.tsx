"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { COASTER } from "./Coaster";
import { ROOM, TABLE } from "./palette";
import { coasterTexture, paneTexture, shadowTexture, softDot, wallTexture, woodTexture } from "./textures";

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

/**
 * A panel that follows the wall. The room is round, so anything flat pressed
 * against it buries its own edges inside the curve — a flat 1.9-wide pane only
 * showed about 1.0 of itself, while the glazing bar in front of it showed more
 * and appeared to overhang. Everything on the wall is an arc.
 */
function arcGeometry(radius: number, width: number, height: number, segments = 24) {
  const theta = width / radius;
  return new THREE.CylinderGeometry(radius, radius, height, segments, 1, true, -theta / 2, theta);
}

function Arc({
  radius,
  width,
  height,
  y = 0,
  segments,
  children,
}: {
  radius: number;
  width: number;
  height: number;
  y?: number;
  segments?: number;
  children: React.ReactNode;
}) {
  const geometry = useMemo(
    () => arcGeometry(radius, width, height, segments),
    [radius, width, height, segments],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} position={[0, y, 0]}>
      {children}
    </mesh>
  );
}

/** The window: the room's only light, and visible as you come round to it. */
function Window() {
  const glow = useMemo(() => (typeof document === "undefined" ? null : softDot()), []);
  useEffect(() => () => glow?.dispose(), [glow]);
  const pane = useMemo(() => (typeof document === "undefined" ? null : paneTexture()), []);
  useEffect(() => () => pane?.dispose(), [pane]);
  // Pushed past white so the bloom pass has something to catch: a window you
  // can look straight at is not a surface, it is a source.
  const blown = useMemo(() => new THREE.Color(ROOM.pane).multiplyScalar(2.1), []);

  const R = ROOM.radius;
  return (
    <group rotation={[0, ROOM.windowAzimuth, 0]}>
      {/* Reveal, casing, glass, bars — each a shade closer to the room. */}
      <Arc radius={R - 0.01} width={2.52} height={3.32} y={1.35}>
        <meshStandardMaterial color="#6d5340" roughness={0.95} side={THREE.BackSide} />
      </Arc>
      <Arc radius={R - 0.02} width={2.26} height={3.06} y={1.35}>
        <meshStandardMaterial color="#cdb99f" roughness={0.9} side={THREE.BackSide} />
      </Arc>
      <Arc radius={R - 0.03} width={1.9} height={2.7} y={1.35}>
        <meshBasicMaterial map={pane} color={blown} side={THREE.BackSide} toneMapped={false} />
      </Arc>
      <Arc radius={R - 0.04} width={0.06} height={2.7} y={1.35} segments={3}>
        <meshBasicMaterial color="#140c06" side={THREE.BackSide} toneMapped={false} />
      </Arc>
      <Arc radius={R - 0.04} width={1.9} height={0.055} y={1.6}>
        <meshBasicMaterial color="#140c06" side={THREE.BackSide} toneMapped={false} />
      </Arc>

      {/* The spill. Additive, in front of the glass, so the window reads as a
          source rather than a bright rectangle stuck on the wall. */}
      {glow && (
        <Arc radius={R - 0.12} width={3.6} height={4.4} y={1.35}>
          <meshBasicMaterial
            map={glow}
            color="#fff1d8"
            transparent
            opacity={0.3}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.BackSide}
            toneMapped={false}
          />
        </Arc>
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

/** A soft patch under anything standing on the floor, so it is not adrift. */
export function PropShadow({
  position,
  scale,
  opacity = 0.55,
}: {
  position: [number, number, number];
  scale: number;
  opacity?: number;
}) {
  return <BakedShadow position={position} scale={[scale, scale * 0.9]} opacity={opacity} />;
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
