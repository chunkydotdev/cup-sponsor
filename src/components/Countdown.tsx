"use client";

import { useEffect, useState } from "react";
import { msUntilShoot } from "@/lib/spot";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function Segment({ value, unit }: { value: number; unit: string }) {
  return (
    <span className="inline-flex items-baseline gap-0.5">
      <span className="font-mono text-lg tabular-nums text-foreground sm:text-xl">{pad(value)}</span>
      <span className="text-[10px] text-brew">{unit}</span>
    </span>
  );
}

/** Time left to outbid whoever is on the cup. Mount-only, to keep SSR honest. */
export function Countdown() {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setLeft(msUntilShoot());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const total = left === null ? 0 : Math.floor(left / 1000);

  return (
    <span className={`inline-flex items-baseline gap-2 ${left === null ? "opacity-40" : ""}`}>
      <Segment value={Math.floor(total / 3600)} unit="h" />
      <Segment value={Math.floor((total % 3600) / 60)} unit="m" />
      <Segment value={total % 60} unit="s" />
    </span>
  );
}
