"use client";

/**
 * A rubber duck. Same trick as the teddy — spheres and a cone — but glossy
 * rather than matte, which is most of what tells the two apart at this size.
 */
export function Duck({
  position,
  rotation = [0, 0, 0],
  scale = 1,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}) {
  const rubber = (
    <meshPhysicalMaterial color="#ffd21e" roughness={0.26} metalness={0} clearcoat={0.9} clearcoatRoughness={0.2} />
  );
  const bill = (
    <meshPhysicalMaterial color="#ef8b1c" roughness={0.35} metalness={0} clearcoat={0.7} clearcoatRoughness={0.25} />
  );

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Body: a flattened egg, longer front to back than it is wide. */}
      <mesh position={[0, 0.34, 0]} scale={[0.44, 0.34, 0.58]}>
        <sphereGeometry args={[1, 24, 20]} />
        {rubber}
      </mesh>
      {/* Tail, cocked up at the back. */}
      <mesh position={[0, 0.44, -0.52]} rotation={[-1.05, 0, 0]}>
        <coneGeometry args={[0.19, 0.36, 16]} />
        {rubber}
      </mesh>

      {/* Neck, then head — held clear of the body, or the two spheres merge
          into one lump and it stops being a duck. */}
      <mesh position={[0, 0.58, 0.13]} scale={[0.17, 0.2, 0.17]}>
        <sphereGeometry args={[1, 18, 14]} />
        {rubber}
      </mesh>
      <mesh position={[0, 0.82, 0.16]} scale={[0.25, 0.26, 0.25]}>
        <sphereGeometry args={[1, 22, 18]} />
        {rubber}
      </mesh>
      {/* Bill: a cone laid on its side and squashed flat. It has to be big —
          it is the only part of the silhouette that says duck. */}
      <mesh position={[0, 0.79, 0.44]} rotation={[Math.PI / 2 - 0.12, 0, 0]} scale={[1, 1, 0.42]}>
        <coneGeometry args={[0.16, 0.32, 16]} />
        {bill}
      </mesh>

      <mesh position={[-0.13, 0.9, 0.3]} scale={0.04}>
        <sphereGeometry args={[1, 12, 10]} />
        <meshStandardMaterial color="#26160c" roughness={0.4} />
      </mesh>
      <mesh position={[0.13, 0.9, 0.3]} scale={0.04}>
        <sphereGeometry args={[1, 12, 10]} />
        <meshStandardMaterial color="#26160c" roughness={0.4} />
      </mesh>
    </group>
  );
}
