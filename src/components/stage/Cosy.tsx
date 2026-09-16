"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Teddy } from "./Teddy";
import { PropShadow } from "./Room";
import { ROOM } from "./palette";
import { clothTexture, rugTexture, softDot } from "./textures";

/** Put something on the wall of the round room, facing in. */
function at(azimuth: number, radius: number, y: number) {
  return [Math.sin(azimuth) * radius, y, Math.cos(azimuth) * radius] as [number, number, number];
}

/** The rug the table stands on. */
function Rug() {
  const texture = useMemo(() => (typeof document === "undefined" ? null : rugTexture()), []);
  useEffect(() => () => texture?.dispose(), [texture]);
  if (!texture) return null;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, ROOM.floorY + 0.012, 0]}>
      <circleGeometry args={[3.3, 72]} />
      <meshStandardMaterial map={texture} roughness={1} metalness={0} />
    </mesh>
  );
}

/**
 * A curtain: an arc of the wall with its radius pushed in and out by a sine, so
 * it hangs in folds. Flat cloth reads as cardboard; the folds are the whole
 * point of putting fabric in a room.
 */
function curtainGeometry(radius: number, width: number, height: number, folds: number, depth: number) {
  const theta = width / radius;
  const geo = new THREE.CylinderGeometry(radius, radius, height, 48, 12, true, -theta / 2, theta);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const r = Math.hypot(x, z);
    const angle = Math.atan2(x, z);
    // Gathered at the top, falling looser towards the hem.
    const drape = 0.55 + 0.45 * (0.5 - pos.getY(i) / height);
    const pushed = r + Math.sin((angle / theta) * Math.PI * 2 * folds) * depth * drape;
    pos.setX(i, Math.sin(angle) * pushed);
    pos.setZ(i, Math.cos(angle) * pushed);
  }
  geo.computeVertexNormals();
  return geo;
}

function Curtain({ offset, width = 1.15 }: { offset: number; width?: number }) {
  const texture = useMemo(() => (typeof document === "undefined" ? null : clothTexture("#8a6a4e")), []);
  useEffect(() => () => texture?.dispose(), [texture]);
  const geometry = useMemo(() => curtainGeometry(ROOM.radius - 0.16, width, 3.9, 3, 0.07), [width]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  if (!texture) return null;
  return (
    <group rotation={[0, ROOM.windowAzimuth + offset, 0]}>
      <mesh geometry={geometry} position={[0, 1.5, 0]}>
        <meshStandardMaterial map={texture} color="#a98363" roughness={1} metalness={0} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** Curtain pole across the window. */
function Pole() {
  const geometry = useMemo(() => {
    const theta = 3.3 / (ROOM.radius - 0.2);
    return new THREE.CylinderGeometry(ROOM.radius - 0.2, ROOM.radius - 0.2, 0.05, 32, 1, true, -theta / 2, theta);
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} position={[0, 3.45, 0]} rotation={[0, ROOM.windowAzimuth, 0]}>
      <meshStandardMaterial color="#3a2718" roughness={0.6} metalness={0.25} side={THREE.DoubleSide} />
    </mesh>
  );
}

/** A floor lamp: the room's warm light, opposite the cold one. */
function FloorLamp({ azimuth }: { azimuth: number }) {
  const base = at(azimuth, 5.15, ROOM.floorY);
  return (
    <group position={base}>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.34, 0.38, 0.06, 32]} />
        <meshStandardMaterial color="#2b1c11" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[0, 1.15, 0]}>
        <cylinderGeometry args={[0.035, 0.045, 2.3, 16]} />
        <meshStandardMaterial color="#2b1c11" roughness={0.45} metalness={0.45} />
      </mesh>
      {/* The shade glows from inside rather than being lit from outside. */}
      <mesh position={[0, 2.5, 0]}>
        <cylinderGeometry args={[0.42, 0.58, 0.62, 32, 1, true]} />
        <meshStandardMaterial
          color="#f6dcb4"
          emissive="#ffca7d"
          emissiveIntensity={1.5}
          roughness={1}
          side={THREE.DoubleSide}
        />
      </mesh>
      <pointLight position={[0, 2.45, 0]} intensity={14} distance={9} decay={2} color="#ffc47e" />
      {/* The pool it throws on the floor. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[1.5, 48]} />
        <meshBasicMaterial color="#ffb765" transparent opacity={0.09} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** A side table with the things that say somebody lives here. */
function SideTable({ azimuth }: { azimuth: number }) {
  const spot = at(azimuth, 4.9, ROOM.floorY);
  const books: [number, number, string][] = [
    [0.5, 0.075, "#7a3b34"],
    [0.46, 0.06, "#3f5340"],
    [0.42, 0.05, "#2f3f56"],
  ];
  let stack = 0.92;
  return (
    <group position={spot} rotation={[0, -azimuth, 0]}>
      <mesh position={[0, 0.88, 0]}>
        <cylinderGeometry args={[0.78, 0.78, 0.07, 48]} />
        <meshStandardMaterial color="#3a2718" roughness={0.55} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.44, 0]}>
        <cylinderGeometry args={[0.1, 0.14, 0.82, 20]} />
        <meshStandardMaterial color="#31200f" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.44, 0.48, 0.06, 28]} />
        <meshStandardMaterial color="#31200f" roughness={0.6} />
      </mesh>

      {books.map(([w, h, colour], i) => {
        const y = stack + h / 2;
        stack += h;
        return (
          <mesh key={colour} position={[-0.24, y, 0.06]} rotation={[0, i * 0.16 - 0.1, 0]}>
            <boxGeometry args={[w, h, w * 0.72]} />
            <meshStandardMaterial color={colour} roughness={0.85} />
          </mesh>
        );
      })}

      {/* A plant, as a pot and a handful of leaves. */}
      <group position={[0.3, 0.92, -0.05]}>
        <mesh position={[0, 0.13, 0]}>
          <cylinderGeometry args={[0.16, 0.12, 0.26, 24]} />
          <meshStandardMaterial color="#b98d63" roughness={0.9} />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.sin(a) * 0.12, 0.42 + (i % 2) * 0.1, Math.cos(a) * 0.12]}
              rotation={[Math.cos(a) * 0.5, a, Math.sin(a) * 0.5]}
              scale={[0.07, 0.22, 0.13]}
            >
              <sphereGeometry args={[1, 12, 10]} />
              <meshStandardMaterial color={i % 2 ? "#4b6b3c" : "#5d7f47"} roughness={0.9} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

/** Steam. The cup is hot, and nothing says that like the air above it moving. */
function Steam({ from, count = 170 }: { from: [number, number, number]; count?: number }) {
  const points = useRef<THREE.Points>(null);
  const sprite = useMemo(() => (typeof document === "undefined" ? null : softDot()), []);
  useEffect(() => () => sprite?.dispose(), [sprite]);

  const { geometry, seeds } = useMemo(() => {
    let seed = 0x57ea3;
    const random = () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const positions = new Float32Array(count * 3);
    const s = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      s[i * 2] = random();
      s[i * 2 + 1] = 0.16 + random() * 0.2;
      positions[i * 3 + 1] = random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return { geometry: geo, seeds: s };
  }, [count]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ clock }, delta) => {
    const attr = points.current?.geometry.getAttribute("position") as THREE.BufferAttribute | undefined;
    if (!attr) return;
    const t = clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      let life = attr.getY(i) + seeds[i * 2 + 1] * delta;
      if (life > 1) life -= 1;
      attr.setY(i, life);
      // Rises, widens, and wanders — steam never goes straight up.
      const phase = seeds[i * 2] * Math.PI * 2;
      const drift = Math.sin(t * 0.6 + phase) * 0.1 * life;
      attr.setX(i, Math.sin(phase) * 0.062 * (0.3 + life) + drift * 0.6);
      attr.setZ(i, Math.cos(phase) * 0.062 * (0.3 + life) + drift * 0.3);
    }
    attr.needsUpdate = true;
  });

  if (!sprite) return null;
  return (
    <points ref={points} geometry={geometry} position={from} scale={[1, 1.1, 1]}>
      <pointsMaterial
        map={sprite}
        color="#ffe9cf"
        size={0.085}
        sizeAttenuation
        transparent
        opacity={0.055}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

/** Everything in the room that is there purely to make it somewhere to sit. */
export function Cosy({ steamFrom }: { steamFrom: [number, number, number] }) {
  return (
    <group>
      <Rug />
      <Pole />
      <Curtain offset={-0.34} />
      <Curtain offset={0.34} />
      <FloorLamp azimuth={5.45} />
      <SideTable azimuth={0.75} />
      <PropShadow position={at(0.95, 4.35, ROOM.floorY + 0.014)} scale={1.5} />
      <PropShadow position={at(4.6, 3.6, ROOM.floorY + 0.014)} scale={1.25} />
      <PropShadow position={at(0.75, 4.9, ROOM.floorY + 0.014)} scale={2.1} opacity={0.5} />
      <PropShadow position={at(5.45, 5.15, ROOM.floorY + 0.014)} scale={1.5} opacity={0.45} />
      <Teddy position={at(0.95, 4.35, ROOM.floorY)} rotation={[0, -0.95 + 0.3, 0]} scale={0.85} />
      <Teddy
        position={at(4.6, 3.6, ROOM.floorY)}
        rotation={[0, -4.6 - 0.2, 0]}
        scale={0.72}
        fur="#8d8a93"
        muzzle="#ded9d2"
      />
      <Steam from={steamFrom} />
    </group>
  );
}
