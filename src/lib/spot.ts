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
  closed: boolean;
};

export async function fetchSpot(): Promise<Spot> {
  const res = await fetch("/api/spot", { cache: "no-store" });
  if (!res.ok) throw new Error("Could not load the spot.");
  return res.json();
}

/**
 * This is one auction, not a daily cycle. Bidding closes once; whoever holds
 * the cup then gets their logo printed on a real mug, and that mug is in every
 * morning photo for the fortnight after.
 */
export const CLOSES_AT = Date.parse("2026-09-20T07:30:00+02:00");
export const RUN_DAYS = 14;

export function msUntilClose(now: number = Date.now()) {
  return Math.max(0, CLOSES_AT - now);
}

export function biddingClosed(now: number = Date.now()) {
  return now >= CLOSES_AT;
}
