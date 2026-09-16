"use client";

import { useEffect, useState } from "react";
import { msUntilShoot } from "@/lib/spot";

function pad(n: number) {
  return String(n).padStart(2, "0");
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

  if (left === null) return <span className="font-mono tabular-nums text-brew-bright">--:--:--</span>;

  const total = Math.floor(left / 1000);
  return (
    <span className="font-mono tabular-nums text-brew-bright">
      {pad(Math.floor(total / 3600))}:{pad(Math.floor((total % 3600) / 60))}:{pad(total % 60)}
    </span>
  );
}
