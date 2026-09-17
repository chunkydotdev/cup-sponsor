import Link from "next/link";

/**
 * Who runs the site. Swedish e-commerce law (e-handelslagen §8) wants this
 * easy to find, and the payment processor wants it on the pages it links to.
 */
export const COMPANY = {
  name: "Junghard Software AB",
  orgNumber: "559217-6753",
  address: "Jans väg 5, Göteborg, Sweden",
  email: "magnus@junghard.com",
  site: "https://cup.junghard.com",
} as const;

/** A plain page of prose, in the room's palette, with its own scroll. */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="fixed inset-0 overflow-y-auto">
      <article className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
        <Link href="/" className="text-xs text-foreground/50 underline-offset-2 hover:text-brew hover:underline">
          ← Back to the cup
        </Link>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-xs text-foreground/45">Last updated {updated}</p>
        <div className="legal mt-8 text-[15px] leading-relaxed text-foreground/80">{children}</div>
        <footer className="mt-12 border-t border-line pt-6 text-xs text-foreground/45">
          <p>
            {COMPANY.name} · org. nr {COMPANY.orgNumber} · {COMPANY.address} ·{" "}
            <a href={`mailto:${COMPANY.email}`} className="hover:text-brew">
              {COMPANY.email}
            </a>
          </p>
          <p className="mt-2">
            <Link href="/terms" className="hover:text-brew">
              Terms
            </Link>{" "}
            ·{" "}
            <Link href="/privacy" className="hover:text-brew">
              Privacy
            </Link>
          </p>
        </footer>
      </article>
    </main>
  );
}
