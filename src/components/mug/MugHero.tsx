"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import {
  PHOTO_SRC,
  SCENE,
  type SceneConfig,
  cameraPosition,
  mugPlacement,
  photoPlaneRotationX,
  photoPlaneSize,
} from "@/lib/scene";
import { Mug } from "./Mug";

/** The morning photograph, square-on to the camera and filling the frame. */
function Photo({ cfg, src }: { cfg: SceneConfig; src: string }) {
  const texture = useLoader(THREE.TextureLoader, src);
  const { width, height } = photoPlaneSize(cfg);
  return (
    <mesh rotation={[photoPlaneRotationX(cfg), 0, 0]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={texture}
        map-colorSpace={THREE.SRGBColorSpace}
        map-anisotropy={8}
        toneMapped={false}
      />
    </mesh>
  );
}

/** Drag spins the cup; let go and it drifts back to facing you. */
function SpinnableMug({
  logoUrl,
  cfg,
  spin,
  opacity,
}: {
  logoUrl: string | null;
  cfg: SceneConfig;
  spin: React.RefObject<number>;
  opacity: number;
}) {
  const holder = useRef<THREE.Group>(null);
  const { position, radius } = mugPlacement(cfg);

  // useFrame runs on the render loop, not React's — mutating the scene graph
  // and the spin ref here is exactly how react-three-fiber is meant to animate.
  // eslint-disable-next-line react-hooks/immutability
  useFrame((_, delta) => {
    if (!holder.current) return;
    holder.current.rotation.y = THREE.MathUtils.damp(holder.current.rotation.y, spin.current, 6, delta);
    // eslint-disable-next-line react-hooks/immutability
    spin.current = THREE.MathUtils.damp(spin.current, 0, 1.2, delta);
  });

  return (
    <group position={position} scale={radius}>
      <group ref={holder}>
        <Mug logoUrl={logoUrl} cfg={cfg} opacity={opacity} />
      </group>
    </group>
  );
}

export function MugHero({
  logoUrl,
  cfg = SCENE,
  photoSrc = PHOTO_SRC,
  mugOpacity = 1,
  className = "",
}: {
  logoUrl: string | null;
  cfg?: SceneConfig;
  photoSrc?: string;
  mugOpacity?: number;
  className?: string;
}) {
  const spin = useRef(0);
  const dragging = useRef(false);
  const lastX = useRef(0);

  return (
    <div
      className={`relative mx-auto w-full max-w-[min(100%,58vh)] touch-pan-y overflow-hidden rounded-2xl border border-line bg-neutral-900 select-none ${className}`}
      style={{ aspectRatio: String(cfg.photoAspect) }}
      onPointerDown={(e) => {
        dragging.current = true;
        lastX.current = e.clientX;
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return;
        spin.current = THREE.MathUtils.clamp(
          spin.current - (e.clientX - lastX.current) / 140,
          -Math.PI,
          Math.PI,
        );
        lastX.current = e.clientX;
      }}
      onPointerUp={() => (dragging.current = false)}
      onPointerLeave={() => (dragging.current = false)}
    >
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true }}
        camera={{ fov: cfg.fovDeg, position: cameraPosition(cfg).toArray(), near: 0.1, far: 100 }}
        onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
      >
        <Suspense fallback={null}>
          <Photo cfg={cfg} src={photoSrc} />
          <SpinnableMug logoUrl={logoUrl} cfg={cfg} spin={spin} opacity={mugOpacity} />

          {/* Window light from the left, warm lamp from the right — as in the room. */}
          <ambientLight intensity={0.5} color="#cbd5e6" />
          <directionalLight position={[-5, 6, 7]} intensity={1.7} color="#fff2df" />
          <directionalLight position={[6, 1.5, 3]} intensity={0.5} color="#ffd3a4" />
          <Environment resolution={256}>
            <Lightformer form="rect" intensity={2.4} position={[-4, 4, 5]} scale={[7, 7, 1]} color="#fff4e6" />
            <Lightformer form="rect" intensity={0.8} position={[5, 1, 3]} scale={[4, 4, 1]} color="#ffd9b0" />
            <Lightformer form="rect" intensity={0.4} position={[0, -4, -5]} scale={[9, 9, 1]} color="#93a7c2" />
          </Environment>
        </Suspense>
      </Canvas>

      <p className="pointer-events-none absolute top-3 left-3 rounded-full bg-black/35 px-3 py-1 text-[11px] tracking-wide text-white/75 backdrop-blur-sm">
        drag to spin the cup
      </p>
    </div>
  );
}
