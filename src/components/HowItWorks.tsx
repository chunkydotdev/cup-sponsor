const STEPS = [
  {
    title: "Upload your logo",
    body: "Drop in a PNG or an SVG and watch it wrap onto the cup in front of you. No account, no forms beyond a name.",
  },
  {
    title: "Outbid whoever is on it",
    body: "One spot, one holder. Beat the standing bid and the cup is yours until someone beats you.",
  },
  {
    title: "Your card is held, not charged",
    body: "We authorise the amount and leave it there. Get outbid and the hold is released the same second.",
  },
  {
    title: "07:30, the photo goes out",
    body: "Whoever is holding the cup at 07:30 Oslo time is on the photo — and only then does the money move.",
  },
];

export function HowItWorks() {
  return (
    <section className="rounded-2xl border border-line bg-surface p-6">
      <h2 className="mb-5 text-sm font-medium tracking-wide text-foreground/70 uppercase">How it works</h2>
      <ol className="grid gap-5 sm:grid-cols-2">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-3">
            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface-2 font-mono text-xs text-brew">
              {i + 1}
            </span>
            <div>
              <h3 className="mb-1 text-sm font-medium">{step.title}</h3>
              <p className="text-sm leading-relaxed text-foreground/55">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
