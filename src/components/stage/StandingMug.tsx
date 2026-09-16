"use client";

import { MUG_BASE_Y, Mug } from "@/components/mug/Mug";
import { COASTER } from "./Coaster";

/** Rim radius of the cup on the table, in world units. */
export const MUG_RADIUS = 0.5;

/**
 * The cup, standing still on its coaster in the middle of the room. It does not
 * turn — the camera walks around it, and the spot is printed on both faces so
 * it reads from either side.
 */
export function StandingMug({ logoUrl }: { logoUrl: string | null }) {
  return (
    <group position={[0, COASTER.height - MUG_BASE_Y * MUG_RADIUS, 0]} scale={MUG_RADIUS}>
      <Mug logoUrl={logoUrl} />
    </group>
  );
}
