import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;

/**
 * Stripe is optional. Without a secret key the app runs in demo mode: bids are
 * accepted and the mug updates, but no money is ever held. That keeps the site
 * fully clickable before the account exists.
 */
export const stripe = key ? new Stripe(key) : null;
export const demoMode = !key;
