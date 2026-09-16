"use client";

import { FramedPhoto } from "./FramedPhoto";
import { ROOM } from "./palette";

/** How far off the wall a frame hangs. */
const HANG = ROOM.radius - 0.06;

/**
 * Where the past mornings hang, as angles round the room. The window's arc is
 * left clear, and so is the stretch behind the cup at load, which is today's.
 */
const SLOTS: { azimuth: number; y: number; height: number }[] = [
  { azimuth: 0.0, y: 1.55, height: 1.5 },
  { azimuth: 0.72, y: 1.25, height: 1.25 },
  { azimuth: 1.44, y: 1.65, height: 1.65 },
  { azimuth: 2.95, y: 1.32, height: 1.3 },
  { azimuth: 4.3, y: 1.62, height: 1.55 },
  { azimuth: 5.0, y: 1.22, height: 1.2 },
  { azimuth: 5.66, y: 1.58, height: 1.45 },
];

/** Straight across the room from where the camera starts. */
const TODAY = { azimuth: 3.49, y: 1.62, height: 2.3 };

function hang(azimuth: number, y: number) {
  return [Math.sin(azimuth) * HANG, y, Math.cos(azimuth) * HANG] as [number, number, number];
}

/**
 * The gallery: this morning's photograph large, straight across from where you
 * start, and every past morning around the rest of the room. With fewer photos
 * than hooks the list simply repeats — the wall fills up as the mornings do.
 */
export function Gallery({ today, past }: { today: string; past: string[] }) {
  const pool = past.length > 0 ? past : [today];
  return (
    <group>
      <FramedPhoto
        src={today}
        position={hang(TODAY.azimuth, TODAY.y)}
        rotation={[0, TODAY.azimuth + Math.PI, 0]}
        height={TODAY.height}
      />
      {SLOTS.map((slot, i) => (
        <FramedPhoto
          key={slot.azimuth}
          src={pool[i % pool.length]}
          position={hang(slot.azimuth, slot.y)}
          rotation={[0, slot.azimuth + Math.PI, 0]}
          height={slot.height}
        />
      ))}
    </group>
  );
}
