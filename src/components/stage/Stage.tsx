"use client";

import { Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { PHOTO_SRC } from "@/lib/photo";
import { CameraRig } from "./CameraRig";
import { FramedPhoto } from "./FramedPhoto";
import { Room } from "./Room";
import { StandingMug } from "./StandingMug";
import { ROOM } from "./palette";

export function Stage({
  logoUrl,
  shifted = false,
  className = "",
}: {
  logoUrl: string | null;
  /** Slide the room left when a panel is open, so the cup stays in view. */
  shifted?: boolean;
  className?: string;
}) {
  const spin = useRef(0);
  const dragging = useRef(false);
  const lastX = useRef(0);

  return (
    <div
      className={`absolute inset-0 touch-pan-y transition-transform duration-500 ease-out select-none ${shifted ? "sm:-translate-x-[14%]" : ""} ${className}`}
      onPointerDown={(e) => {
        dragging.current = true;
        lastX.current = e.clientX;
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return;
        spin.current = THREE.MathUtils.clamp(
          spin.current - (e.clientX - lastX.current) / 180,
          -Math.PI * 2,
          Math.PI * 2,
        );
        lastX.current = e.clientX;
      }}
      onPointerUp={() => (dragging.current = false)}
      onPointerLeave={() => (dragging.current = false)}
    >
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        camera={{ fov: 32, position: [0, 1.32, 3.7], near: 0.1, far: 40 }}
      >
        <Suspense fallback={null}>
          <CameraRig />
          <fog attach="fog" args={["#0d0805", 5.5, 15]} />

          <Room />
          <StandingMug logoUrl={logoUrl} spin={spin} />

          {/* This morning's photograph, framed on the wall behind the cup. */}
          <FramedPhoto src={PHOTO_SRC} position={[-1.78, 1.12, -3.34]} rotation={[0, 0.1, 0]} height={1.55} />

          {/* The cup has to sit on the table, not hover over it. */}
          <ContactShadows
            position={[0, 0.002, 0]}
            opacity={0.62}
            scale={5}
            blur={2.4}
            far={1.6}
            resolution={512}
            color="#120a04"
          />

          {/* Key light is the window, off to the upper left. */}
          <ambientLight intensity={0.22} color="#6d5946" />
          <directionalLight position={[-3.4, 4.2, 2.2]} intensity={2.3} color={ROOM.daylight} />
          <directionalLight position={[3.2, 1.4, 1.6]} intensity={0.35} color="#8fa6c4" />
          <Environment resolution={256}>
            <Lightformer form="rect" intensity={3} position={[-3.5, 3.2, 2.4]} scale={[4, 6, 1]} color="#ffe6c4" />
            <Lightformer form="rect" intensity={0.4} position={[3.5, 1.5, 1.5]} scale={[3, 4, 1]} color="#7d94b5" />
            <Lightformer form="rect" intensity={0.25} position={[0, -2, -3]} scale={[8, 8, 1]} color="#2a1a10" />
          </Environment>

          <EffectComposer>
            <Bloom mipmapBlur intensity={0.55} luminanceThreshold={0.62} luminanceSmoothing={0.28} />
            <Vignette eskil={false} offset={0.26} darkness={0.78} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
