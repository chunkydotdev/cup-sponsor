export function formatMoney(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

/** What it costs to take an empty cup. */
export const MIN_BID_CENTS = 5000;

/**
 * Taking the cup off whoever holds it costs double what they paid. It makes the
 * price of the spot obvious without anyone having to think, and it means the
 * standing holder always knows exactly what it would take to lose it.
 */
export function minimumNextBid(currentLeadCents: number | null) {
  return currentLeadCents === null ? MIN_BID_CENTS : currentLeadCents * 2;
}
