"use client";

import { useCallback, useEffect, useState } from "react";
import { MugHero } from "@/components/mug/MugHero";
import { BidPanel } from "@/components/BidPanel";
import { Countdown } from "@/components/Countdown";
import { HowItWorks } from "@/components/HowItWorks";
import { SponsorHistory } from "@/components/SponsorHistory";
import { ViewerStats } from "@/components/ViewerStats";
import { formatMoney } from "@/lib/money";
import { fetchSpot, type Spot } from "@/lib/spot";

export function CupsponsorApp({ initialSpot }: { initialSpot: Spot }) {
  const [spot, setSpot] = useState<Spot>(initialSpot);
  /** What the cup shows right now: the leader's logo, or yours while you bid. */
  const [preview, setPreview] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const next = await fetchSpot().catch(() => null);
    if (next) setSpot(next);
  }, []);

  useEffect(() => {
    // Someone else can take the cup while you are looking at it.
    const id = setInterval(refresh, 20_000);
    return () => clearInterval(id);
  }, [refresh]);

  const onCup = preview ?? spot.leader?.logoPath ?? null;

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:py-14">
      <header className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">cupsponsor</h1>
          <p className="mt-1 text-sm text-foreground/55">
            One coffee cup. One logo. A new photo every morning.
          </p>
        </div>
        <p className="text-sm text-foreground/55">
          next photo in <Countdown />
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-6">
          <MugHero logoUrl={onCup} />
          <div className="rounded-2xl border border-line bg-surface p-5">
            {spot.leader ? (
              <p className="text-sm text-foreground/70">
                <span className="text-brew-bright">{spot.leader.sponsor}</span> holds the cup at{" "}
                <span className="font-mono">{formatMoney(spot.leader.amountCents)}</span>.
              </p>
            ) : (
              <p className="text-sm text-foreground/55">
                Nobody holds the cup. The first bid takes it.
              </p>
            )}
          </div>
          <HowItWorks />
        </div>

        <aside className="flex flex-col gap-6">
          <BidPanel
            spot={spot}
            onLogoPreview={setPreview}
            onPlaced={() => {
              setPreview(null);
              refresh();
            }}
          />
          <ViewerStats />
          <SponsorHistory history={spot.history} />
        </aside>
      </div>

      <footer className="mt-12 border-t border-line pt-6 text-xs text-foreground/35">
        Fully public: every bid, every sponsor, every number on this page.
      </footer>
    </div>
  );
}
