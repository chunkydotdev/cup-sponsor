import { NextResponse } from "next/server";
import { BidError, promoteBid } from "@/lib/auction";

export async function POST(req: Request) {
  try {
    const { bidId } = await req.json();
    const bid = await promoteBid(String(bidId));
    return NextResponse.json({ ok: true, bid: { id: bid.id, status: bid.status } });
  } catch (err) {
    if (err instanceof BidError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[bid/confirm]", err);
    return NextResponse.json({ error: "Could not confirm that bid." }, { status: 500 });
  }
}
