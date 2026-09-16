"use client";

import { useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { ROOM } from "./palette";

/** Where the photograph hangs. A portrait phone has no room beside the cup, so
 *  on narrow screens it hangs above it instead of to its left. */
const WIDE = { position: [-1.72, 1.12, -3.34] as const, height: 1.55 };
const NARROW = { position: [-0.06, 1.98, -3.34] as const, height: 1.25 };

export function MorningPhoto({ src }: { src: string }) {
  const aspect = useThree((s) => s.size.width / s.size.height);
  const spot = aspect >= 1.1 ? WIDE : NARROW;
  return (
    <FramedPhoto
      src={src}
      position={[...spot.position]}
      rotation={[0, aspect >= 1.1 ? 0.1 : 0, 0]}
      height={spot.height}
    />
  );
}

/**
 * This morning's photograph, framed on the wall. It is the thing being sold —
 * the cup on the table is what goes on it.
 */
export function FramedPhoto({
  src,
  position,
  rotation = [0, 0, 0],
  height = 1.5,
}: {
  src: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  height?: number;
}) {
  const texture = useLoader(THREE.TextureLoader, src);
  const aspect = texture.image ? texture.image.width / texture.image.height : 0.75;
  const width = height * aspect;
  const border = height * 0.045;

  return (
    <group position={position} rotation={rotation}>
      {/* Frame, then mount, then the print itself. */}
      <mesh position={[0, 0, -0.012]}>
        <boxGeometry args={[width + border * 2.4, height + border * 2.4, 0.035]} />
        <meshStandardMaterial color={ROOM.frame} roughness={0.55} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0, 0.008]}>
        <planeGeometry args={[width + border, height + border]} />
        <meshStandardMaterial color="#e9dccb" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          map={texture}
          map-colorSpace={THREE.SRGBColorSpace}
          map-anisotropy={8}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
