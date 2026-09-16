export function formatMoney(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

/** The floor for the very first bid of a day, and the step every bid after it. */
export const MIN_BID_CENTS = 500;
export const MIN_INCREMENT_CENTS = 100;

export function minimumNextBid(currentLeadCents: number | null) {
  return currentLeadCents === null ? MIN_BID_CENTS : currentLeadCents + MIN_INCREMENT_CENTS;
}
