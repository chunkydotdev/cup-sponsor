import "server-only";
import { bidHistory, leadingBid, type Bid } from "./db";
import { minimumNextBid } from "./money";
import type { PublicBid, Spot } from "./spot";
import { demoMode } from "./stripe";

function publicBid(bid: Bid): PublicBid {
  return {
    id: bid.id,
    sponsor: bid.sponsor,
    linkUrl: bid.link_url,
    logoPath: bid.logo_path,
    amountCents: bid.amount_cents,
    status: bid.status,
    createdAt: bid.created_at,
  };
}

/** The whole public state of the cup. The page and /api/spot share it. */
export function readSpot(): Spot {
  const lead = leadingBid();
  return {
    leader: lead ? publicBid(lead) : null,
    minimumBidCents: minimumNextBid(lead?.amount_cents ?? null),
    history: bidHistory().map(publicBid),
    demoMode,
  };
}
