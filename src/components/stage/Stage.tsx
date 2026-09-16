"use client";

import { Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Bloom, EffectComposer, HueSaturation, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import { Cosy } from "./Cosy";
import { Gallery } from "./Gallery";
import { OrbitRig, type Orbit } from "./OrbitRig";
import { COASTER } from "./Coaster";
import { Coaster, CoasterShadow, CupShadow, Room, WINDOW_DIR } from "./Room";
import { MUG_RADIUS, StandingMug } from "./StandingMug";
import { ROOM } from "./palette";

export function Stage({
  logoUrl,
  today,
  past,
  shifted = false,
  className = "",
}: {
  logoUrl: string | null;
  today: string;
  past: string[];
  /** Slide the room left when a panel is open, so the cup stays in view. */
  shifted?: boolean;
  className?: string;
}) {
  const orbit = useRef<Orbit>({ offset: 0, velocity: 0, dragging: false });
  const lastX = useRef(0);

  const key = WINDOW_DIR.clone().multiplyScalar(ROOM.radius - 1.5);

  return (
    <div
      className={`absolute inset-0 touch-pan-y transition-transform duration-500 ease-out select-none ${shifted ? "sm:-translate-x-[14%]" : ""} ${className}`}
      onPointerDown={(e) => {
        orbit.current.dragging = true;
        orbit.current.velocity = 0;
        lastX.current = e.clientX;
      }}
      onPointerMove={(e) => {
        if (!orbit.current.dragging) return;
        // Drag walks you round the room one-to-one, and the last flick is what
        // it carries on doing once you let go.
        const turn = (e.clientX - lastX.current) / 260;
        orbit.current.offset += turn;
        orbit.current.velocity = THREE.MathUtils.clamp(turn * 60, -6, 6);
        lastX.current = e.clientX;
      }}
      onPointerUp={() => (orbit.current.dragging = false)}
      onPointerLeave={() => (orbit.current.dragging = false)}
    >
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        camera={{ fov: 32, position: [0, 1.32, 3.7], near: 1, far: 30 }}
      >
        <Suspense fallback={null}>
          <OrbitRig orbit={orbit} />
          <fog attach="fog" args={["#0d0805", 8, 22]} />

          <Room />
          <Gallery today={today} past={past} />
          <CoasterShadow />
          <Coaster />
          <CupShadow />
          <StandingMug logoUrl={logoUrl} />
          {/* Steam leaves from the mouth of the cup, not its middle. */}
          <Cosy steamFrom={[0, COASTER.height + MUG_RADIUS * 2.14, 0]} />

          {/* The window is the only light in the room. Everything else is spill. */}
          <ambientLight intensity={0.5} color="#7b6550" />
          <directionalLight position={[key.x, 3.4, key.z]} intensity={1.9} color={ROOM.daylight} />
          <pointLight position={[key.x, 1.6, key.z]} intensity={11} distance={18} decay={2} color={ROOM.daylight} />
          {/* Just enough bounce that the far side of the cup is never a hole. */}
          <directionalLight position={[-key.x, 1.6, -key.z]} intensity={0.85} color="#a08a6c" />
          <Environment resolution={256}>
            <Lightformer form="rect" intensity={3.2} position={[key.x, 2.2, key.z]} scale={[3, 5, 1]} color="#ffe6c4" />
            <Lightformer form="rect" intensity={0.6} position={[-key.x, 1.4, -key.z]} scale={[5, 4, 1]} color="#7d6248" />
            <Lightformer form="rect" intensity={0.2} position={[0, -3, 0]} scale={[9, 9, 1]} color="#2a1a10" />
          </Environment>

          <EffectComposer>
            {/* No depth of field: the whole room sits inside about five units,
                so there is nothing for it to separate, and every setting that
                blurred the background took the cup with it. */}
            <Bloom mipmapBlur intensity={0.45} luminanceThreshold={0.72} luminanceSmoothing={0.26} />
            <HueSaturation saturation={0.08} />
            {/* Grain, lightly. A perfectly clean frame reads as a render. */}
            <Noise blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.055} />
            <Vignette eskil={false} offset={0.26} darkness={0.72} />
          </EffectComposer>
        </Suspense>
      </Canvas>

    </div>
  );
}
