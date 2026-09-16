export type PublicBid = {
  id: string;
  sponsor: string;
  linkUrl: string | null;
  logoPath: string;
  amountCents: number;
  status: string;
  createdAt: number;
};

export type Spot = {
  leader: PublicBid | null;
  minimumBidCents: number;
  history: PublicBid[];
  demoMode: boolean;
};

export async function fetchSpot(): Promise<Spot> {
  const res = await fetch("/api/spot", { cache: "no-store" });
  if (!res.ok) throw new Error("Could not load the spot.");
  return res.json();
}

/** The photo goes out at 07:30, Oslo time. That is the deadline. */
export const SHOOT_HOUR = 7;
export const SHOOT_MINUTE = 30;
export const SHOOT_TZ = "Europe/Oslo";

export function msUntilShoot(now: number = Date.now()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: SHOOT_TZ,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(now));
  const [h, m, s] = parts.split(":").map(Number);
  const target = SHOOT_HOUR * 3600 + SHOOT_MINUTE * 60;
  let delta = target - (h * 3600 + m * 60 + s);
  if (delta <= 0) delta += 86400;
  return delta * 1000;
}
