"use client";

import { useMemo, useRef, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js/pure";
import { formatMoney } from "@/lib/money";
import type { Spot } from "@/lib/spot";
import { track } from "@/lib/track";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

/** The card step. Only mounted once Stripe has handed us a client secret. */
function CardStep({ bidId, onDone }: { bidId: string; onDone: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;
        setBusy(true);
        setError(null);
        const { error: stripeError } = await stripe.confirmPayment({
          elements,
          redirect: "if_required",
        });
        if (stripeError) {
          setError(stripeError.message ?? "Your bank declined the hold.");
          setBusy(false);
          return;
        }
        track("card authorised");
        const res = await fetch("/api/bid/confirm", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ bidId }),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error ?? "We could not confirm that bid.");
          setBusy(false);
          return;
        }
        onDone();
      }}
    >
      <PaymentElement />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="rounded-xl bg-brew px-5 py-3 font-medium text-[#140f0b] transition hover:bg-brew-bright disabled:opacity-50"
      >
        {busy ? "Placing the hold…" : "Authorise the hold"}
      </button>
      <p className="text-xs text-foreground/45">
        This is a hold, not a charge. The money only moves when bidding closes on 20 September, and
        only if you are still holding the cup. The moment somebody doubles you, the hold is cancelled
        and you have your money back.
      </p>
    </form>
  );
}

export function BidPanel({
  spot,
  onLogoPreview,
  onPlaced,
}: {
  spot: Spot;
  onLogoPreview: (path: string | null) => void;
  onPlaced: () => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  // Loaded here, not at module scope: Stripe.js sets its own cookies the
  // moment it loads, and someone who only came to look should never get them.
  // The panel is only mounted once it is open.
  const stripePromise = useMemo(() => (publishableKey ? loadStripe(publishableKey) : null), []);
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [sponsor, setSponsor] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [notifyEmail, setNotifyEmail] = useState("");
  const [amount, setAmount] = useState(String(spot.minimumBidCents / 100));
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<{ bidId: string; clientSecret: string } | null>(null);
  const [done, setDone] = useState(false);

  const minimum = spot.minimumBidCents;

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    const body = new FormData();
    body.append("logo", file);
    const res = await fetch("/api/upload", { method: "POST", body });
    const json = await res.json();
    setUploading(false);
    if (!res.ok) return setError(json.error ?? "That logo would not upload.");
    setLogoPath(json.logoPath);
    onLogoPreview(json.logoPath);
    track("logo uploaded");
  }

  async function placeBid() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/bid", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sponsor,
        linkUrl: linkUrl.trim() || null,
        notifyEmail: notifyEmail.trim() || null,
        logoPath,
        amountCents: Math.round(Number(amount) * 100),
      }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) return setError(json.error ?? "That bid did not go through.");
    track("bid placed", { amount: Math.round(Number(amount)) });
    if (json.demo || !json.clientSecret) {
      setDone(true);
      onPlaced();
      return;
    }
    setPending({ bidId: json.id, clientSecret: json.clientSecret });
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-brew/40 bg-surface p-6">
        <h2 className="mb-2 text-lg font-medium">The cup is yours.</h2>
        <p className="text-sm text-foreground/60">
          You are holding the cup. Unless somebody doubles you before bidding closes on 20 September,
          your logo gets printed on a real mug — and that mug is in every morning photo for the two
          weeks after.
        </p>
      </div>
    );
  }

  if (pending && stripePromise) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-6">
        <h2 className="mb-4 text-lg font-medium">Hold {formatMoney(Math.round(Number(amount) * 100))}</h2>
        <Elements stripe={stripePromise} options={{ clientSecret: pending.clientSecret, appearance: { theme: "night" } }}>
          <CardStep
            bidId={pending.bidId}
            onDone={() => {
              setDone(true);
              onPlaced();
            }}
          />
        </Elements>
      </div>
    );
  }

  const ready = Boolean(logoPath) && sponsor.trim().length > 0 && Number(amount) * 100 >= minimum;

  return (
    <div className="rounded-2xl border border-line bg-surface p-6">
      <h2 className="mb-1 text-lg font-medium">Take the cup</h2>
      <p className="mb-5 text-sm text-foreground/55">
        {spot.leader ? (
          <>
            {spot.leader.sponsor} holds it at {formatMoney(spot.leader.amountCents)}. Doubling that —{" "}
            <span className="text-brew-bright">{formatMoney(minimum)}</span> — takes it.
          </>
        ) : (
          <>
            The cup is empty. <span className="text-brew-bright">{formatMoney(minimum)}</span> takes it.
          </>
        )}
      </p>

      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-2 block text-xs tracking-wide text-foreground/50 uppercase">Your logo</label>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="flex w-full items-center gap-3 rounded-xl border border-dashed border-line bg-surface-2 px-4 py-3 text-left text-sm transition hover:border-brew/60"
          >
            {logoPath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoPath} alt="" className="h-8 w-8 rounded object-contain" />
            ) : (
              <span className="grid h-8 w-8 place-items-center rounded bg-surface text-foreground/40">+</span>
            )}
            <span className="text-foreground/70">
              {uploading ? "Uploading…" : logoPath ? "Change logo" : "PNG, JPG, WEBP or SVG — up to 4 MB"}
            </span>
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
          {logoPath && <p className="mt-2 text-xs text-brew">It is on the cup already.</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-2">
            <span className="text-xs tracking-wide text-foreground/50 uppercase">Sponsor</span>
            <input
              value={sponsor}
              onChange={(e) => setSponsor(e.target.value)}
              placeholder="Acme Inc."
              className="rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm outline-none focus:border-brew/60"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs tracking-wide text-foreground/50 uppercase">Bid (USD)</span>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              className="rounded-xl border border-line bg-surface-2 px-4 py-3 font-mono text-sm outline-none focus:border-brew/60"
            />
          </label>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-xs tracking-wide text-foreground/50 uppercase">Link (optional)</span>
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://acme.com"
            className="rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm outline-none focus:border-brew/60"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs tracking-wide text-foreground/50 uppercase">Email (optional)</span>
          <input
            value={notifyEmail}
            onChange={(e) => setNotifyEmail(e.target.value)}
            type="email"
            placeholder="you@acme.com"
            className="rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm outline-none focus:border-brew/60"
          />
          <span className="text-[11px] text-foreground/35">
            Only ever used to tell you if somebody doubles you. There are still no accounts.
          </span>
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="button"
          disabled={!ready || busy}
          onClick={placeBid}
          className="rounded-xl bg-brew px-5 py-3 font-medium text-[#140f0b] transition hover:bg-brew-bright disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Working…" : spot.demoMode ? "Take the spot (demo)" : "Continue to hold"}
        </button>

        <p className="text-xs text-foreground/40">
          By continuing you accept the{" "}
          <a href="/terms" target="_blank" rel="noopener" className="underline underline-offset-2 hover:text-brew">
            terms
          </a>
          : the bid is binding, your logo is yours to print, and it is shown publicly. Your data is
          handled as in the{" "}
          <a href="/privacy" target="_blank" rel="noopener" className="underline underline-offset-2 hover:text-brew">
            privacy policy
          </a>
          .
        </p>

        {spot.demoMode && (
          <p className="text-xs text-foreground/40">
            Demo mode: no Stripe keys are set, so nothing is charged and nothing is held.
          </p>
        )}
      </div>
    </div>
  );
}
