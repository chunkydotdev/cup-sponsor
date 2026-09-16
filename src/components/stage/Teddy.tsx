"use client";

/**
 * A teddy, out of spheres and capsules. Sitting, legs forward, arms down and a
 * little out — the pose does most of the work; a standing one reads as a
 * snowman. Everything is oversized and rounded on purpose.
 */
export function Teddy({
  position,
  rotation = [0, 0, 0],
  scale = 1,
  fur = "#a9763f",
  muzzle = "#e0c39a",
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  fur?: string;
  muzzle?: string;
}) {
  // Wool has no specular to speak of; the moment it shines it stops being soft.
  const pelt = <meshStandardMaterial color={fur} roughness={1} metalness={0} />;
  const pale = <meshStandardMaterial color={muzzle} roughness={1} metalness={0} />;
  const dark = <meshStandardMaterial color="#2a1a10" roughness={0.6} metalness={0} />;

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Body */}
      <mesh position={[0, 0.5, 0]} scale={[0.52, 0.5, 0.46]}>
        <sphereGeometry args={[1, 24, 20]} />
        {pelt}
      </mesh>
      {/* Belly */}
      <mesh position={[0, 0.46, 0.18]} scale={[0.32, 0.3, 0.2]}>
        <sphereGeometry args={[1, 20, 16]} />
        {pale}
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.02, 0.03]} scale={[0.42, 0.4, 0.4]}>
        <sphereGeometry args={[1, 24, 20]} />
        {pelt}
      </mesh>
      <mesh position={[-0.3, 1.32, 0]} scale={0.15}>
        <sphereGeometry args={[1, 16, 14]} />
        {pelt}
      </mesh>
      <mesh position={[0.3, 1.32, 0]} scale={0.15}>
        <sphereGeometry args={[1, 16, 14]} />
        {pelt}
      </mesh>
      {/* Snout, nose, eyes */}
      <mesh position={[0, 0.96, 0.34]} scale={[0.19, 0.15, 0.14]}>
        <sphereGeometry args={[1, 20, 16]} />
        {pale}
      </mesh>
      <mesh position={[0, 1.0, 0.46]} scale={[0.06, 0.05, 0.05]}>
        <sphereGeometry args={[1, 12, 10]} />
        {dark}
      </mesh>
      <mesh position={[-0.14, 1.11, 0.36]} scale={0.045}>
        <sphereGeometry args={[1, 12, 10]} />
        {dark}
      </mesh>
      <mesh position={[0.14, 1.11, 0.36]} scale={0.045}>
        <sphereGeometry args={[1, 12, 10]} />
        {dark}
      </mesh>

      {/* Legs, forward, the way a sat-down bear's are */}
      <mesh position={[-0.22, 0.2, 0.3]} rotation={[1.35, 0, 0]}>
        <capsuleGeometry args={[0.16, 0.26, 8, 16]} />
        {pelt}
      </mesh>
      <mesh position={[0.22, 0.2, 0.3]} rotation={[1.35, 0, 0]}>
        <capsuleGeometry args={[0.16, 0.26, 8, 16]} />
        {pelt}
      </mesh>
      {/* Pads */}
      <mesh position={[-0.22, 0.2, 0.52]} scale={[0.11, 0.1, 0.05]}>
        <sphereGeometry args={[1, 14, 12]} />
        {pale}
      </mesh>
      <mesh position={[0.22, 0.2, 0.52]} scale={[0.11, 0.1, 0.05]}>
        <sphereGeometry args={[1, 14, 12]} />
        {pale}
      </mesh>

      {/* Arms */}
      <mesh position={[-0.46, 0.56, 0.08]} rotation={[0.3, 0, 0.55]}>
        <capsuleGeometry args={[0.12, 0.3, 8, 16]} />
        {pelt}
      </mesh>
      <mesh position={[0.46, 0.56, 0.08]} rotation={[0.3, 0, -0.55]}>
        <capsuleGeometry args={[0.12, 0.3, 8, 16]} />
        {pelt}
      </mesh>
    </group>
  );
}
