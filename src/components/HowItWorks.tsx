const STEPS = [
  {
    title: "Upload your logo",
    body: "Drop in a PNG or an SVG and watch it wrap onto the cup in front of you. No account, no forms beyond a name.",
  },
  {
    title: "Double it to take it",
    body: "An empty cup costs $50. After that, taking it off whoever holds it costs double what they paid — so the price of the spot is never a guess.",
  },
  {
    title: "Your card is held, never charged",
    body: "We authorise the amount and leave it sitting there. The second somebody doubles you, that hold is cancelled and the money is back — not refunded later, released immediately.",
  },
  {
    title: "20 September, it gets printed",
    body: "Whoever holds the cup when bidding closes has their logo printed on a real mug — and that mug is the one in every morning photo for the fortnight after.",
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
