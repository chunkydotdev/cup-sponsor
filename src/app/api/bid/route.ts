import { NextResponse } from "next/server";
import { BidError, placeBid } from "@/lib/auction";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await placeBid({
      sponsor: String(body.sponsor ?? ""),
      linkUrl: body.linkUrl ? String(body.linkUrl) : null,
      logoPath: String(body.logoPath ?? ""),
      amountCents: Math.round(Number(body.amountCents)),
      notifyEmail: typeof body.notifyEmail === "string" && body.notifyEmail.includes("@")
        ? body.notifyEmail.trim().slice(0, 254)
        : null,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof BidError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[bid]", err);
    return NextResponse.json({ error: "Could not place that bid." }, { status: 500 });
  }
}
