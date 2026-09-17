"use client";

import { useCallback, useEffect, useState } from "react";
import { BidPanel } from "@/components/BidPanel";
import { Countdown } from "@/components/Countdown";
import { HowItWorks } from "@/components/HowItWorks";
import { Modal } from "@/components/Modal";
import { SponsorHistory } from "@/components/SponsorHistory";
import { Stage } from "@/components/stage/Stage";
import { ViewerStats } from "@/components/ViewerStats";
import { formatMoney } from "@/lib/money";
import { fetchSpot, type Spot } from "@/lib/spot";

type Sheet = "bid" | "sponsors" | "how" | null;

export function CupsponsorApp({
  initialSpot,
  today,
  past,
}: {
  initialSpot: Spot;
  today: string;
  past: string[];
}) {
  const [spot, setSpot] = useState<Spot>(initialSpot);
  /** What the cup shows right now: the leader's logo, or yours while you bid. */
  const [preview, setPreview] = useState<string | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);

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
    <div className="fixed inset-0 overflow-hidden bg-[#0b0603]">
      {/* The room glow sits behind the canvas, which is transparent. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(130%_95%_at_22%_18%,#3d2412_0%,#1a0f08_45%,#0b0603_78%)]" />

      <Stage logoUrl={onCup} today={today} past={past} shifted={sheet !== null} />

      {/* Scrims, so the chrome stays readable whatever the room is doing. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/65 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/70 to-transparent" />

      {/* ---- HUD ---------------------------------------------------------- */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="pointer-events-auto">
            <h1 className="text-base font-semibold tracking-tight sm:text-lg">cupsponsor</h1>
            <p className="mt-0.5 text-xs text-foreground/60 sm:text-sm">
              {spot.leader ? (
                <>
                  <span className="text-brew-bright">{spot.leader.sponsor}</span> is on the cup at{" "}
                  <span className="font-mono">{formatMoney(spot.leader.amountCents)}</span>.
                </>
              ) : (
                <>The cup is empty. The first bid takes it.</>
              )}
            </p>
            <div className="mt-1 flex items-center gap-3 text-[11px] text-foreground/40">
              <button onClick={() => setSheet("how")} className="underline-offset-2 hover:text-brew hover:underline">
                How it works
              </button>
              <button
                onClick={() => setSheet("sponsors")}
                className="underline-offset-2 hover:text-brew hover:underline"
              >
                Sponsors
              </button>
              <a href="/terms" className="underline-offset-2 hover:text-brew hover:underline">
                Terms
              </a>
              <a href="/privacy" className="underline-offset-2 hover:text-brew hover:underline">
                Privacy
              </a>
            </div>
          </div>

          <div className="text-right">
            <p className="mb-0.5 text-[10px] tracking-widest text-foreground/40 uppercase">Bidding ends in</p>
            <Countdown />
          </div>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div className="pointer-events-auto hidden sm:block">
            <ViewerStats compact />
          </div>

          <div className="pointer-events-auto flex flex-1 flex-col items-center gap-2 sm:flex-none">
            <button
              onClick={() => setSheet("bid")}
              disabled={spot.closed}
              className="w-full rounded-full bg-brew px-8 py-3 text-sm font-medium text-[#140f0b] shadow-[0_0_40px_-6px_var(--color-brew)] transition hover:bg-brew-bright disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none sm:w-auto"
            >
              {spot.closed ? "Bidding closed" : `Take the cup — ${formatMoney(spot.minimumBidCents)}`}
            </button>
              </div>

          <div className="hidden text-right text-[11px] text-foreground/40 sm:block">
            <p className="text-foreground/70">Printed on a real mug</p>
            <p>In every morning photo for two weeks</p>
          </div>
        </div>
      </div>

      {/* ---- Sheets ------------------------------------------------------- */}
      <Modal open={sheet === "bid"} onClose={() => setSheet(null)}>
        <BidPanel
          spot={spot}
          onLogoPreview={setPreview}
          onPlaced={() => {
            setPreview(null);
            refresh();
          }}
        />
      </Modal>
      <Modal open={sheet === "sponsors"} onClose={() => setSheet(null)}>
        <SponsorHistory history={spot.history} />
      </Modal>
      <Modal open={sheet === "how"} onClose={() => setSheet(null)}>
        <HowItWorks />
      </Modal>
    </div>
  );
}
