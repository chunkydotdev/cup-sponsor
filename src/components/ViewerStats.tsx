"use client";

import { useEffect, useState } from "react";

type Audience = { source: "plausible" | "local"; today: number; allTime: number; last30Days: number };

function sessionId() {
  const key = "cupsponsor:session";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-2xl tabular-nums text-foreground">{value}</span>
      <span className="text-xs tracking-wide text-foreground/45 uppercase">{label}</span>
    </div>
  );
}

/**
 * What a sponsor is actually buying: the people looking at the cup. Live count
 * comes from heartbeats, the history from Plausible when it is wired up.
 */
export function ViewerStats({ compact = false }: { compact?: boolean } = {}) {
  const [watching, setWatching] = useState<number | null>(null);
  const [audience, setAudience] = useState<Audience | null>(null);

  useEffect(() => {
    const beat = async () => {
      const res = await fetch("/api/presence", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId: sessionId() }),
      });
      if (res.ok) setWatching((await res.json()).watching);
    };
    // The first beat also counts the visit.
    fetch("/api/stats", { method: "POST" })
      .then((r) => r.json())
      .then(setAudience)
      .catch(() => {});
    beat();
    const id = setInterval(beat, 15_000);
    return () => clearInterval(id);
  }, []);

  const n = (v: number | null | undefined) => (v === null || v === undefined ? "—" : v.toLocaleString("en-US"));

  if (compact) {
    return (
      <div className="flex flex-col gap-1 text-[11px] text-foreground/45">
        <span className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brew-bright opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brew-bright" />
          </span>
          <span className="font-mono text-foreground/80">{n(watching)}</span> watching now
        </span>
        <span>
          <span className="font-mono text-foreground/80">{n(audience?.today)}</span> watched today ·{" "}
          <span className="font-mono text-foreground/80">{n(audience?.allTime)}</span> all time
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brew-bright opacity-70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-brew-bright" />
        </span>
        <h2 className="text-sm font-medium tracking-wide text-foreground/70 uppercase">Who sees your logo</h2>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Stat value={n(watching)} label="watching now" />
        <Stat value={n(audience?.today)} label="views today" />
        <Stat value={n(audience?.allTime)} label="views all time" />
      </div>
      {audience?.source === "local" && (
        <p className="mt-4 text-xs text-foreground/35">
          Counted on this server. Connect Plausible to report the real numbers.
        </p>
      )}
    </div>
  );
}
