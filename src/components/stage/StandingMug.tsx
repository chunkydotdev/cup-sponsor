"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MUG_BASE_Y, Mug } from "@/components/mug/Mug";

/** Rim radius of the cup on the plinth, in world units. */
export const MUG_RADIUS = 0.5;

/**
 * The cup, standing on its own base rather than pinned to a photograph. Drag
 * spins it; let go and it drifts back to facing the room.
 */
export function StandingMug({ logoUrl, spin }: { logoUrl: string | null; spin: React.RefObject<number> }) {
  const holder = useRef<THREE.Group>(null);

  // useFrame runs on the render loop, not React's — mutating the scene graph
  // and the spin ref here is how react-three-fiber is meant to animate.
  // eslint-disable-next-line react-hooks/immutability
  useFrame(({ clock }, delta) => {
    if (!holder.current) return;
    const idle = Math.sin(clock.getElapsedTime() * 0.22) * 0.32;
    holder.current.rotation.y = THREE.MathUtils.damp(holder.current.rotation.y, spin.current + idle, 5, delta);
    // eslint-disable-next-line react-hooks/immutability
    spin.current = THREE.MathUtils.damp(spin.current, 0, 0.9, delta);
  });

  return (
    <group position={[0, -MUG_BASE_Y * MUG_RADIUS, 0]} scale={MUG_RADIUS}>
      <group ref={holder}>
        <Mug logoUrl={logoUrl} />
      </group>
    </group>
  );
}
