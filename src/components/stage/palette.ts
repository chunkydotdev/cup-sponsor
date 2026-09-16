/**
 * A gallery of mornings: a round, dim room with one window in it. Everything
 * is warm, and the cup on its table is the only thing properly lit.
 */
export const ROOM = {
  radius: 6.5,
  floorY: -0.9,
  wallTop: 3.6,
  /** Which way the window is, in radians around the room. */
  windowAzimuth: 2.2,

  wallTop_: "#0d0805",
  wallMid: "#4a2f1b",
  wallFoot: "#120b06",
  floor: "#22170f",
  table: "#2b1d13",
  daylight: "#ffdcae",
  frame: "#0e0906",
} as const;

export const TABLE = { topRadius: 1.3, topThickness: 0.07 } as const;
