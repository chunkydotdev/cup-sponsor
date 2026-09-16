import { NextResponse } from "next/server";
import { captureLeader } from "@/lib/auction";

/**
 * Run this when the morning photo goes out — it takes the money from the
 * standing hold. Guarded by ADMIN_TOKEN; there are no user accounts here.
 */
export async function POST(req: Request) {
  const token = process.env.ADMIN_TOKEN;
  if (!token || req.headers.get("authorization") !== `Bearer ${token}`) {
    return NextResponse.json({ error: "Nope." }, { status: 401 });
  }
  const bid = await captureLeader();
  if (!bid) return NextResponse.json({ captured: null, message: "Nobody was holding the spot." });
  return NextResponse.json({ captured: { id: bid.id, sponsor: bid.sponsor, amountCents: bid.amount_cents } });
}
