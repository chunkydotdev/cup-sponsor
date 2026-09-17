import { randomUUID } from "node:crypto";
import { db, getBid, leadingBid, type Bid } from "./db";
import { sendHoldingEmail, sendOutbidEmail } from "./email";
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
  /** Optional. The only thing we ever do with it is say "you were outbid". */
  notifyEmail: string | null;
};

/**
 * Create a bid and the hold that backs it. In live mode the card is only
 * authorised here (capture_method: manual) — the money moves when the photo
 * actually goes out. The caller confirms the returned client secret, then
 * calls `promoteBid`.
 */
/**
 * The link is shown publicly as an href, so it has to be a real web address.
 * Anything else (javascript:, data:, garbage) is rejected rather than stored.
 */
function cleanLink(raw: string | null): string | null {
  const text = raw?.trim();
  if (!text) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(text) ? text : `https://${text}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new BidError("That link does not look like a web address.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new BidError("The link has to start with http:// or https://.");
  }
  return url.toString();
}

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
  const linkUrl = cleanLink(input.linkUrl);

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

  db().prepare(
    `INSERT INTO bids (id, sponsor, link_url, logo_path, amount_cents, currency, status, payment_intent_id, created_at, notify_email)
     VALUES (@id, @sponsor, @link_url, @logo_path, @amount_cents, 'usd', @status, @payment_intent_id, @created_at, @notify_email)`,
  ).run({
    id,
    sponsor: input.sponsor.trim(),
    link_url: linkUrl,
    logo_path: input.logoPath,
    amount_cents: input.amountCents,
    status: demoMode ? "leading" : "pending",
    payment_intent_id: paymentIntentId,
    created_at: now,
    notify_email: input.notifyEmail,
  });

  // Demo mode has no card step, so the bid takes the spot immediately — and
  // has to send the same mail the live path does, or it stops being a preview
  // of what actually happens.
  if (demoMode) {
    const placed = getBid(id)!;
    await outbidEveryoneBelow(id, placed);
    if (placed.notify_email) {
      await sendHoldingEmail({
        to: placed.notify_email,
        sponsor: placed.sponsor,
        amountCents: placed.amount_cents,
      });
    }
  }

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

  db().prepare(`UPDATE bids SET status = 'leading' WHERE id = ?`).run(bid.id);
  await outbidEveryoneBelow(bid.id, bid);
  if (bid.notify_email) {
    await sendHoldingEmail({ to: bid.notify_email, sponsor: bid.sponsor, amountCents: bid.amount_cents });
  }
  return getBid(bid.id)!;
}

/** Release every other standing hold — only one bid owns the cup at a time. */
async function outbidEveryoneBelow(winnerId: string, winner: Bid) {
  const losers = db()
    .prepare(`SELECT * FROM bids WHERE status = 'leading' AND id != ?`)
    .all(winnerId) as Bid[];
  for (const loser of losers) {
    await releaseBid(loser.id, "outbid");
    // Told after the hold is actually cancelled, so the mail is never a lie.
    if (loser.notify_email) {
      await sendOutbidEmail({
        to: loser.notify_email,
        sponsor: loser.sponsor,
        wasCents: loser.amount_cents,
        nowCents: winner.amount_cents,
        byWhom: winner.sponsor,
      });
    }
  }
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
  db().prepare(`UPDATE bids SET status = ?, released_at = ? WHERE id = ?`).run(status, Date.now(), bidId);
}

/** The morning run: take the money from whoever is holding the spot. */
export async function captureLeader() {
  const lead = leadingBid();
  if (!lead) return null;
  if (stripe && lead.payment_intent_id) {
    await stripe.paymentIntents.capture(lead.payment_intent_id);
  }
  db().prepare(`UPDATE bids SET status = 'captured', captured_at = ? WHERE id = ?`).run(Date.now(), lead.id);
  return getBid(lead.id)!;
}
