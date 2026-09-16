"use client";

import { formatMoney } from "@/lib/money";
import type { PublicBid } from "@/lib/spot";

const LABEL: Record<string, string> = {
  leading: "on the cup",
  outbid: "outbid — hold released",
  captured: "was on the cup",
};

export function SponsorHistory({ history }: { history: PublicBid[] }) {
  if (history.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-6">
        <h2 className="mb-2 text-sm font-medium tracking-wide text-foreground/70 uppercase">Sponsors</h2>
        <p className="text-sm text-foreground/50">Nobody has taken the cup yet. It is wide open.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-6">
      <h2 className="mb-4 text-sm font-medium tracking-wide text-foreground/70 uppercase">Sponsors</h2>
      <ul className="flex flex-col divide-y divide-line">
        {history.map((bid) => (
          <li key={bid.id} className="flex items-center gap-3 py-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bid.logoPath} alt="" className="h-9 w-9 shrink-0 rounded-lg bg-surface-2 object-contain p-1" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">
                {bid.linkUrl ? (
                  <a href={bid.linkUrl} target="_blank" rel="noopener noreferrer nofollow" className="hover:text-brew-bright">
                    {bid.sponsor}
                  </a>
                ) : (
                  bid.sponsor
                )}
              </p>
              <p className="text-xs text-foreground/40">{LABEL[bid.status] ?? bid.status}</p>
            </div>
            <span className="font-mono text-sm tabular-nums text-foreground/70">{formatMoney(bid.amountCents)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
