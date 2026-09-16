"use client";

import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { ROOM } from "./palette";

/** One photograph, framed and mounted, hanging flat on the wall. */
export function FramedPhoto({
  src,
  position,
  rotation = [0, 0, 0],
  height = 1.2,
}: {
  src: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  height?: number;
}) {
  const texture = useLoader(THREE.TextureLoader, src);
  const aspect = texture.image ? texture.image.width / texture.image.height : 0.75;
  const width = height * aspect;
  const border = height * 0.05;

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, -0.012]}>
        <boxGeometry args={[width + border * 2.4, height + border * 2.4, 0.04]} />
        <meshStandardMaterial color={ROOM.frame} roughness={0.5} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0, 0.009]}>
        <planeGeometry args={[width + border, height + border]} />
        <meshStandardMaterial color="#e9dccb" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, 0.011]}>
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
