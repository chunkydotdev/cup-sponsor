"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { COASTER } from "./Coaster";
import { ROOM, TABLE } from "./palette";
import {
  coasterTexture,
  mulberry32,
  paneTexture,
  shadowTexture,
  shaftTexture,
  softDot,
  wallTexture,
  woodTexture,
} from "./textures";

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

/**
 * The beam. Low sun through the window lands on the table, and it is the same
 * line for the dust and for the glow: from the middle of the pane to just
 * short of the cup.
 */
const BEAM_FROM = WINDOW_DIR.clone().multiplyScalar(ROOM.radius - 0.2).setY(1.35);
const BEAM_TO = WINDOW_DIR.clone().multiplyScalar(1.6).setY(0.15);
const BEAM_RADIUS = { window: 1.0, table: 0.7 };

/**
 * The shaft of light itself, faked: a few nested open cones along the beam,
 * additive and nearly transparent, so the middle is brighter than the edges
 * the way a column of lit air is. Each cone fades out where its surface turns
 * away from the camera — a cone with a visible silhouette is a lampshade, not
 * light. It does not touch the cup: it ends at the table's edge, so the
 * ceramic never picks up a smear.
 */
const SHAFT_SHADER = {
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vView;
    void main() {
      vUv = uv;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vNormal = normalize(normalMatrix * normal);
      vView = normalize(-mv.xyz);
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 color;
    uniform float opacity;
    uniform sampler2D map;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vView;
    void main() {
      float facing = abs(dot(normalize(vNormal), normalize(vView)));
      float along = texture2D(map, vUv).a;
      float a = pow(facing, 1.6) * along * opacity;
      gl_FragColor = vec4(color * a, a);
    }
  `,
};

function LightShaft() {
  const texture = useMemo(() => (typeof document === "undefined" ? null : shaftTexture()), []);
  useEffect(() => () => texture?.dispose(), [texture]);

  const material = useMemo(() => {
    if (!texture) return null;
    return new THREE.ShaderMaterial({
      ...SHAFT_SHADER,
      uniforms: {
        color: { value: new THREE.Color(ROOM.daylight) },
        opacity: { value: 0.07 },
        map: { value: texture },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
    });
  }, [texture]);
  useEffect(() => () => material?.dispose(), [material]);

  const { length, midpoint, quaternion } = useMemo(() => {
    const axis = BEAM_FROM.clone().sub(BEAM_TO);
    const length = axis.length();
    const midpoint = BEAM_TO.clone().add(BEAM_FROM).multiplyScalar(0.5);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis.normalize());
    return { length, midpoint, quaternion };
  }, []);

  if (!material) return null;
  return (
    <group position={midpoint} quaternion={quaternion}>
      {[1, 0.66, 0.33].map((k) => (
        <mesh key={k} material={material}>
          <cylinderGeometry args={[BEAM_RADIUS.window * k, BEAM_RADIUS.table * k, length, 48, 1, true]} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Dust, hanging in the light. Motes scattered over the whole wall read as a
 * starfield, so these live inside the shaft only, dense in its middle and
 * dim at its edge, and they hang and bob rather than rise: the shape of the
 * shaft is the whole effect.
 */
function Dust({ count = 520 }: { count?: number }) {
  const points = useRef<THREE.Points>(null);
  const sprite = useMemo(() => (typeof document === "undefined" ? null : softDot()), []);
  useEffect(() => () => sprite?.dispose(), [sprite]);

  const { geometry, home, motion } = useMemo(() => {
    const random = mulberry32(0x0ff33);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const move = new Float32Array(count * 2);
    const across = new THREE.Vector3(WINDOW_DIR.z, 0, -WINDOW_DIR.x);
    const axis = BEAM_TO.clone().sub(BEAM_FROM);
    for (let i = 0; i < count; i++) {
      // t runs from the window (0) to the table (1). Across and up are a
      // point in the unit disc, so the motes fill the cone and nothing else.
      const t = random();
      let side = 0;
      let up = 0;
      do {
        side = (random() - 0.5) * 2;
        up = (random() - 0.5) * 2;
      } while (side * side + up * up > 1);
      const radius = BEAM_RADIUS.window + (BEAM_RADIUS.table - BEAM_RADIUS.window) * t;
      const p = BEAM_FROM.clone().addScaledVector(axis, t).addScaledVector(across, side * radius);
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y + up * radius;
      positions[i * 3 + 2] = p.z;
      // Brightest down the middle, and never all the same.
      const core = 1 - (side * side + up * up);
      const glow = core * (0.3 + random() * 0.7);
      colors[i * 3] = colors[i * 3 + 1] = colors[i * 3 + 2] = glow;
      move[i * 2] = random() * Math.PI * 2;
      move[i * 2 + 1] = 0.15 + random() * 0.3;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return { geometry: geo, home: positions.slice(), motion: move };
  }, [count]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ clock }) => {
    const attr = points.current?.geometry.getAttribute("position") as THREE.BufferAttribute | undefined;
    if (!attr) return;
    const t = clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      const phase = motion[i * 2];
      const rate = motion[i * 2 + 1];
      attr.setXYZ(
        i,
        home[i * 3] + Math.sin(t * rate + phase) * 0.05,
        home[i * 3 + 1] + Math.sin(t * rate * 0.7 + phase * 1.3) * 0.06,
        home[i * 3 + 2] + Math.cos(t * rate * 0.9 + phase) * 0.05,
      );
    }
    attr.needsUpdate = true;
  });

  if (!sprite) return null;
  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        map={sprite}
        color={ROOM.daylight}
        vertexColors
        size={0.035}
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
      <LightShaft />
      <Dust />
    </group>
  );
}
