import "server-only";
import { formatMoney } from "./money";

/**
 * Transactional email through Molted (api.molted.email), the same way
 * outlive.lol does it. Off unless fully configured, so local and any
 * half-configured deploy simply never send rather than erroring.
 */
export function emailEnabled() {
  return Boolean(process.env.MOLTED_API_KEY && process.env.MOLTED_TENANT_ID);
}

const SITE = process.env.APP_BASE_URL ?? "https://cup.junghard.com";

async function send(opts: { to: string; subject: string; text: string; html: string; dedupeKey: string }) {
  if (!emailEnabled()) return;
  const base = process.env.MOLTED_BASE_URL ?? "https://api.molted.email";
  try {
    const res = await fetch(`${base}/v1/send/request`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.MOLTED_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        tenantId: process.env.MOLTED_TENANT_ID,
        recipientEmail: opts.to,
        templateId: "_default",
        dedupeKey: opts.dedupeKey,
        payload: { subject: opts.subject, html: opts.html, text: opts.text },
      }),
    });
    if (!res.ok) console.warn("[email] molted refused:", res.status, await res.text());
  } catch (err) {
    // An auction must never fail because a mail server did.
    console.warn("[email] send failed", err);
  }
}

function wrap(lines: string[]) {
  return `<div style="font:16px/1.6 -apple-system,system-ui,sans-serif;color:#221a15">${lines
    .map((l) => `<p style="margin:0 0 14px">${l}</p>`)
    .join("")}</div>`;
}

/**
 * The one email that earns its keep: it tells somebody their money is back and
 * exactly what it would cost to take the cup again.
 */
export async function sendOutbidEmail(opts: {
  to: string;
  sponsor: string;
  wasCents: number;
  nowCents: number;
  byWhom: string;
}) {
  const takeBack = formatMoney(opts.nowCents * 2);
  const text = [
    `${opts.byWhom} has taken the cup off you at ${formatMoney(opts.nowCents)}.`,
    ``,
    `Your hold of ${formatMoney(opts.wasCents)} has been cancelled — that money is already back on your card, not refunded later.`,
    ``,
    `${takeBack} takes it back. Bidding closes 07:30 on 20 September, and whoever is holding the cup then gets their logo printed on a real mug that shows up in every morning photo for the fortnight after.`,
    ``,
    SITE,
  ].join("\n");
  await send({
    to: opts.to,
    subject: `You've been outbid — ${takeBack} takes the cup back`,
    text,
    html: wrap([
      `<strong>${opts.byWhom}</strong> has taken the cup off you at ${formatMoney(opts.nowCents)}.`,
      `Your hold of ${formatMoney(opts.wasCents)} has been cancelled — that money is already back on your card, not refunded later.`,
      `<strong>${takeBack}</strong> takes it back. Bidding closes 07:30 on 20 September.`,
      `<a href="${SITE}" style="color:#b0762a">${SITE}</a>`,
    ]),
    dedupeKey: `outbid:${opts.to}:${opts.wasCents}:${opts.nowCents}`,
  });
}

/** Sent when a bid lands, so the holder knows what it would take to lose it. */
export async function sendHoldingEmail(opts: { to: string; sponsor: string; amountCents: number }) {
  const toBeat = formatMoney(opts.amountCents * 2);
  const text = [
    `You're on the cup at ${formatMoney(opts.amountCents)}.`,
    ``,
    `Nothing has been charged — the amount is held on your card. It only moves if you are still holding the cup when bidding closes at 07:30 on 20 September. Anyone who wants it has to pay ${toBeat}, and the moment they do, your hold is cancelled and the money is back.`,
    ``,
    SITE,
  ].join("\n");
  await send({
    to: opts.to,
    subject: `You're on the cup at ${formatMoney(opts.amountCents)}`,
    text,
    html: wrap([
      `You're on the cup at <strong>${formatMoney(opts.amountCents)}</strong>.`,
      `Nothing has been charged — the amount is held on your card, and only moves if you are still holding the cup when bidding closes at 07:30 on 20 September.`,
      `Anyone who wants it has to pay ${toBeat}. The moment they do, your hold is cancelled and the money is back.`,
      `<a href="${SITE}" style="color:#b0762a">${SITE}</a>`,
    ]),
    dedupeKey: `holding:${opts.to}:${opts.amountCents}`,
  });
}
