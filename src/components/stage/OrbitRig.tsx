"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/** What the camera looks at: the cup, a little above its middle. */
const TARGET = new THREE.Vector3(0, 0.62, 0);
const ELEVATION_DEG = 10.7;
/**
 * How far out the camera walks. Fixed, and comfortably inside ROOM.radius —
 * fitting the cup by moving the camera instead used to push it out through the
 * wall on narrow screens, which showed the far side of the room twice.
 */
const DISTANCE = 5.2;
/**
 * Half the scene we insist on seeing at that distance, in world units. The cup
 * is not symmetric about its axis — the handle reaches ~0.94 out one side —
 * so the width has to clear that with room to spare or a phone crops it.
 */
const HALF_WIDTH = 1.15;
const HALF_HEIGHT = 1.95;
/** Radians per second the camera drifts around the cup. A lap ≈ 70 seconds. */
const IDLE_SPEED = 0.09;

/**
 * Dragging writes into this; the rig reads it and clears it. `offset` is the
 * turn the pointer asked for since the last frame, `velocity` is what it keeps
 * doing after you let go.
 */
export type Orbit = { offset: number; velocity: number; dragging: boolean };

/**
 * The camera circles the cup, so every photograph on the wall comes past. It
 * also has to fit the cup on screen: three keeps the *vertical* field of view
 * fixed, so a portrait phone sees a much narrower slice than a laptop and would
 * crop the cup in half. Pull back by whichever axis is tighter.
 */
export function OrbitRig({ orbit }: { orbit: React.RefObject<Orbit> }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const angle = useRef(0.35);

  // useFrame runs on the render loop, not React's — moving the camera and
  // clearing the drag ref here is how react-three-fiber is meant to animate.
  // eslint-disable-next-line react-hooks/immutability
  useFrame((_, delta) => {
    const o = orbit.current;
    let turn = IDLE_SPEED * delta + o.offset;
    // eslint-disable-next-line react-hooks/immutability
    o.offset = 0;
    if (!o.dragging) {
      turn += o.velocity * delta;
       
      o.velocity = THREE.MathUtils.damp(o.velocity, 0, 2.2, delta);
    }
     
    angle.current += turn;

    // Three keeps the *vertical* field of view fixed, so a portrait phone sees
    // a much narrower slice than a laptop and would crop the cup in half. Open
    // the lens by whichever axis is tighter, rather than backing away.
    const aspect = width / height;
    const halfFov = Math.atan(
      Math.max(HALF_WIDTH / (DISTANCE * aspect), HALF_HEIGHT / DISTANCE),
    );
    const fov = THREE.MathUtils.radToDeg(halfFov) * 2;
    if (Math.abs(camera.fov - fov) > 0.01) {
      // eslint-disable-next-line react-hooks/immutability
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }

    const e = THREE.MathUtils.degToRad(ELEVATION_DEG);
    const flat = Math.cos(e) * DISTANCE;
    camera.position.set(
      Math.sin(angle.current) * flat,
      TARGET.y + Math.sin(e) * DISTANCE,
      Math.cos(angle.current) * flat,
    );
    camera.lookAt(TARGET);
  });

  return null;
}
