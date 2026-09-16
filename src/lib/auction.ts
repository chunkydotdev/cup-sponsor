import { randomUUID } from "node:crypto";
import { db, getBid, leadingBid, type Bid } from "./db";
import { formatMoney, minimumNextBid } from "./money";
import { biddingClosed } from "./spot";
import { demoMode, stripe } from "./stripe";

export class BidError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

export type PlaceBidInput = {
  sponsor: string;
  linkUrl: string | null;
  logoPath: string;
  amountCents: number;
};

/**
 * Create a bid and the hold that backs it. In live mode the card is only
 * authorised here (capture_method: manual) — the money moves when the photo
 * actually goes out. The caller confirms the returned client secret, then
 * calls `promoteBid`.
 */
export async function placeBid(input: PlaceBidInput) {
  if (biddingClosed()) throw new BidError("Bidding has closed. The cup is spoken for.", 409);
  const lead = leadingBid();
  const floor = minimumNextBid(lead?.amount_cents ?? null);
  if (!Number.isInteger(input.amountCents) || input.amountCents < floor) {
    throw new BidError(
      lead
        ? `Taking the cup costs ${formatMoney(floor)} — double what ${lead.sponsor} is holding it at.`
        : `The cup is empty: ${formatMoney(floor)} takes it.`,
    );
  }
  if (!input.sponsor.trim()) throw new BidError("Sponsor name is required.");
  if (!input.logoPath) throw new BidError("A logo is required — it is the thing we print.");

  const id = randomUUID();
  const now = Date.now();
  let paymentIntentId: string | null = null;
  let clientSecret: string | null = null;

  if (stripe) {
    const intent = await stripe.paymentIntents.create({
      amount: input.amountCents,
      currency: "usd",
      capture_method: "manual",
      automatic_payment_methods: { enabled: true },
      description: `Cup sponsorship bid — ${input.sponsor}`,
      metadata: { bid_id: id, sponsor: input.sponsor },
    });
    paymentIntentId = intent.id;
    clientSecret = intent.client_secret;
  }

  db.prepare(
    `INSERT INTO bids (id, sponsor, link_url, logo_path, amount_cents, currency, status, payment_intent_id, created_at)
     VALUES (@id, @sponsor, @link_url, @logo_path, @amount_cents, 'usd', @status, @payment_intent_id, @created_at)`,
  ).run({
    id,
    sponsor: input.sponsor.trim(),
    link_url: input.linkUrl,
    logo_path: input.logoPath,
    amount_cents: input.amountCents,
    status: demoMode ? "leading" : "pending",
    payment_intent_id: paymentIntentId,
    created_at: now,
  });

  // Demo mode has no card step, so the bid takes the spot immediately.
  if (demoMode) await outbidEveryoneBelow(id);

  return { id, clientSecret, demo: demoMode };
}

/**
 * Called once the card is authorised. Promotes the bid to `leading` and
 * releases the hold on whoever it just beat.
 */
export async function promoteBid(bidId: string) {
  const bid = getBid(bidId);
  if (!bid) throw new BidError("Unknown bid.", 404);
  if (bid.status === "leading") return bid;
  if (bid.status !== "pending") throw new BidError(`Bid is ${bid.status}.`);

  if (stripe && bid.payment_intent_id) {
    const intent = await stripe.paymentIntents.retrieve(bid.payment_intent_id);
    if (intent.status !== "requires_capture") {
      throw new BidError(`Card is not authorised yet (${intent.status}).`);
    }
  }

  const lead = leadingBid();
  if (lead && lead.amount_cents >= bid.amount_cents) {
    // Someone bigger landed while this card was being authorised. Refund the
    // hold rather than letting it sit on the card.
    await releaseBid(bid.id, "outbid");
    throw new BidError("Someone outbid you while your card was authorising — your hold was released.");
  }

  db.prepare(`UPDATE bids SET status = 'leading' WHERE id = ?`).run(bid.id);
  await outbidEveryoneBelow(bid.id);
  return getBid(bid.id)!;
}

/** Release every other standing hold — only one bid owns the cup at a time. */
async function outbidEveryoneBelow(winnerId: string) {
  const losers = db
    .prepare(`SELECT * FROM bids WHERE status = 'leading' AND id != ?`)
    .all(winnerId) as Bid[];
  for (const loser of losers) await releaseBid(loser.id, "outbid");
}

/** Cancel the PaymentIntent, which is what actually gives the money back. */
export async function releaseBid(bidId: string, status: "outbid" | "cancelled") {
  const bid = getBid(bidId);
  if (!bid) return;
  if (stripe && bid.payment_intent_id) {
    try {
      await stripe.paymentIntents.cancel(bid.payment_intent_id);
    } catch (err) {
      // Already cancelled or captured — nothing left to release.
      console.warn(`[auction] could not cancel ${bid.payment_intent_id}`, err);
    }
  }
  db.prepare(`UPDATE bids SET status = ?, released_at = ? WHERE id = ?`).run(status, Date.now(), bidId);
}

/** The morning run: take the money from whoever is holding the spot. */
export async function captureLeader() {
  const lead = leadingBid();
  if (!lead) return null;
  if (stripe && lead.payment_intent_id) {
    await stripe.paymentIntents.capture(lead.payment_intent_id);
  }
  db.prepare(`UPDATE bids SET status = 'captured', captured_at = ? WHERE id = ?`).run(Date.now(), lead.id);
  return getBid(lead.id)!;
}
