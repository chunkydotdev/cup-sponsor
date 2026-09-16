"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

/** Where the camera aims, and how far off the floor the eye sits. */
const TARGET = new THREE.Vector3(0, 0.62, 0);
const ELEVATION_DEG = 10.7;
/** Half the room we insist on seeing, in world units. */
const HALF_WIDTH = 0.95;
const HALF_HEIGHT = 1.06;

/**
 * Three keeps the *vertical* field of view fixed, so a portrait phone sees a
 * much narrower slice than a laptop and crops the cup in half. Pull the camera
 * back by whichever of the two axes is tighter.
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);

  useEffect(() => {
    const aspect = width / height;
    const halfFov = THREE.MathUtils.degToRad(camera.fov) / 2;
    const forWidth = HALF_WIDTH / (Math.tan(halfFov) * aspect);
    const forHeight = HALF_HEIGHT / Math.tan(halfFov);
    const distance = THREE.MathUtils.clamp(Math.max(forWidth, forHeight), 2.6, 9);

    const e = THREE.MathUtils.degToRad(ELEVATION_DEG);
    camera.position.set(0, TARGET.y + Math.sin(e) * distance, Math.cos(e) * distance);
    camera.lookAt(TARGET);
    camera.updateProjectionMatrix();
  }, [camera, width, height]);

  return null;
}
