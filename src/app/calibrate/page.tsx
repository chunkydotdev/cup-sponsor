"use client";

import { useEffect, useMemo, useState } from "react";
import { MugHero } from "@/components/mug/MugHero";
import { PHOTO_SRC, SCENE, type SceneConfig, formatConfig } from "@/lib/scene";

type Knob = { key: keyof SceneConfig; label: string; min: number; max: number; step: number; hint?: string };

const KNOBS: Knob[] = [
  { key: "centerU", label: "Cup centre — across", min: 0, max: 1, step: 0.001, hint: "0 = left edge, 1 = right edge" },
  { key: "rimV", label: "Rim centre — down", min: 0, max: 1, step: 0.001, hint: "centre of the rim ellipse" },
  { key: "widthFrac", label: "Cup width", min: 0.05, max: 0.9, step: 0.001, hint: "rim diameter ÷ photo width" },
  { key: "elevationDeg", label: "Camera above the rim", min: 0, max: 45, step: 0.1, hint: "flatter rim = smaller" },
  { key: "rollDeg", label: "Cup tilt", min: -20, max: 20, step: 0.1 },
  { key: "printTop", label: "Print — top", min: -2.5, max: 0, step: 0.01 },
  { key: "printBottom", label: "Print — bottom", min: -3.5, max: -0.2, step: 0.01 },
  { key: "fovDeg", label: "Lens", min: 8, max: 60, step: 0.5, hint: "rarely needs touching" },
  { key: "photoAspect", label: "Photo aspect", min: 0.3, max: 2, step: 0.0001 },
];

/**
 * The photo changes every morning, so the mug has to be re-pinned every
 * morning. Drag until the white cup covers the real one with nothing peeking
 * out, then paste the block into src/lib/scene.ts.
 */
export default function CalibratePage() {
  const [cfg, setCfg] = useState<SceneConfig>(SCENE);
  const [photo, setPhoto] = useState(PHOTO_SRC);
  const [opacity, setOpacity] = useState(1);
  const [copied, setCopied] = useState(false);

  const block = useMemo(() => formatConfig(cfg), [cfg]);

  // Pick up the real dimensions of whatever photo is loaded — one less thing
  // to type wrong.
  useEffect(() => {
    const img = new Image();
    img.onload = () => setCfg((c) => ({ ...c, photoAspect: img.width / img.height }));
    img.src = photo;
  }, [photo]);

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Calibrate the cup</h1>
        <p className="mt-1 max-w-2xl text-sm text-foreground/55">
          Drop in this morning&apos;s photo and drag until the white cup covers the real one with
          nothing peeking out at the edges. Then paste the block below into{" "}
          <code className="text-brew">src/lib/scene.ts</code> and copy the photo to{" "}
          <code className="text-brew">public/photo/today.jpg</code>.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div>
          <MugHero logoUrl={null} cfg={cfg} photoSrc={photo} mugOpacity={opacity} />
          <label className="mt-4 flex items-center gap-3 text-xs text-foreground/50">
            <span className="w-28 shrink-0 uppercase">Cup opacity</span>
            <input
              type="range"
              min={0.25}
              max={1}
              step={0.01}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="flex-1 accent-brew"
            />
            <span className="w-14 text-right font-mono">{opacity.toFixed(2)}</span>
          </label>
          <p className="mt-1 text-xs text-foreground/35">
            Ghost the white cup to see the real one underneath while you line it up.
          </p>
        </div>

        <aside className="flex flex-col gap-5">
          <label className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4">
            <span className="text-xs tracking-wide text-foreground/50 uppercase">This morning&apos;s photo</span>
            <input
              type="file"
              accept="image/*"
              className="text-sm text-foreground/70 file:mr-3 file:rounded-lg file:border-0 file:bg-surface-2 file:px-3 file:py-2 file:text-foreground"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setPhoto(URL.createObjectURL(file));
              }}
            />
          </label>

          <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4">
            {KNOBS.map((knob) => (
              <label key={knob.key} className="flex flex-col gap-1">
                <span className="flex items-baseline justify-between text-xs text-foreground/60">
                  <span>{knob.label}</span>
                  <span className="font-mono text-foreground/80">{Number(cfg[knob.key]).toFixed(3)}</span>
                </span>
                <input
                  type="range"
                  min={knob.min}
                  max={knob.max}
                  step={knob.step}
                  value={cfg[knob.key]}
                  onChange={(e) => setCfg({ ...cfg, [knob.key]: Number(e.target.value) })}
                  className="accent-brew"
                />
                {knob.hint && <span className="text-[11px] text-foreground/30">{knob.hint}</span>}
              </label>
            ))}
            <button
              type="button"
              onClick={() => setCfg(SCENE)}
              className="mt-1 self-start text-xs text-foreground/45 underline hover:text-foreground/80"
            >
              reset to the shipped numbers
            </button>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs tracking-wide text-foreground/50 uppercase">Paste into scene.ts</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(block);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="rounded-lg bg-brew px-3 py-1 text-xs font-medium text-[#140f0b]"
              >
                {copied ? "copied" : "copy"}
              </button>
            </div>
            <pre className="overflow-x-auto rounded-xl bg-surface-2 p-3 font-mono text-[11px] leading-relaxed text-foreground/80">
              {block}
            </pre>
          </div>
        </aside>
      </div>
    </main>
  );
}
