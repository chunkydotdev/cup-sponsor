import { NextResponse } from "next/server";
import { promoteBid } from "@/lib/auction";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/**
 * Belt and braces: the browser calls /api/bid/confirm, but if that call is lost
 * the webhook still promotes an authorised bid and releases the one it beat.
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return NextResponse.json({ ignored: true });

  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "No signature." }, { status: 400 });

  let event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), signature, secret);
  } catch (err) {
    console.error("[webhook] bad signature", err);
    return NextResponse.json({ error: "Bad signature." }, { status: 400 });
  }

  if (event.type === "payment_intent.amount_capturable_updated") {
    const bidId = (event.data.object as { metadata?: Record<string, string> }).metadata?.bid_id;
    if (bidId) await promoteBid(bidId).catch((err) => console.warn("[webhook] promote", err.message));
  }
  return NextResponse.json({ received: true });
}
