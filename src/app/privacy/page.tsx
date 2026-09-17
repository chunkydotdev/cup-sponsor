import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY, LegalPage } from "@/components/Legal";

export const metadata: Metadata = {
  title: "Privacy — cupsponsor",
  description: "What cupsponsor collects, why, and for how long. It is a short list.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated="17 September 2026">
      <p>
        {COMPANY.name} (org. nr {COMPANY.orgNumber}), {COMPANY.address}, runs cupsponsor and is the
        data controller for it. There are no accounts and no sign-up; this page lists everything the
        site handles about you and why. Questions go to{" "}
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.
      </p>

      <h2>1. What we collect</h2>
      <h3>When you place a bid</h3>
      <ul>
        <li>
          <strong>Sponsor name, link and logo.</strong> Needed to run the auction and print the mug
          (performance of a contract, GDPR art. 6(1)(b)). These are public: they are shown on the site
          as the auction record, and the logo is printed and photographed if you win.
        </li>
        <li>
          <strong>Bid amount and status.</strong> Also public, for the same reason. The auction only
          works if everyone can see what the cup is held at.
        </li>
        <li>
          <strong>Email address, optional.</strong> Used for exactly two emails: that your hold is in
          place, and that you have been outbid and your hold is released. Nothing else, and no
          marketing. It is never shown publicly. Legal basis: performance of a contract.
        </li>
        <li>
          <strong>Payment.</strong> Your card details go straight from your browser to Stripe and never
          reach our server. We store Stripe&apos;s reference for the hold, so we can release or capture
          it. Stripe is an independent controller for the payment itself; see{" "}
          <a href="https://stripe.com/privacy" rel="noopener noreferrer">
            Stripe&apos;s privacy policy
          </a>
          .
        </li>
      </ul>

      <h3>When you just look</h3>
      <ul>
        <li>
          <strong>Live viewer count.</strong> Your browser sends a random session id every 45 seconds
          so the page can say how many people are watching. The id is generated in your browser,
          is not linked to anything else, and is deleted from our database within minutes of you
          leaving. Legal basis: legitimate interest in showing the live count.
        </li>
        <li>
          <strong>Analytics.</strong> We use a self-hosted instance of Plausible, which sets no
          cookies and stores no personal data. It counts page views and bids by hashing the
          visitor&apos;s IP address and user agent with a salt that changes daily, so visits cannot
          be tied to a person or followed across days.
        </li>
        <li>
          <strong>Server logs.</strong> Our web server keeps standard access logs (IP address, URL,
          time, user agent) for security and debugging, for at most 30 days. Legal basis:
          legitimate interest in keeping the site running and safe.
        </li>
      </ul>

      <h2>2. Cookies</h2>
      <p>
        The site itself sets none. The live viewer id is kept in your browser&apos;s session storage
        and goes when the tab closes. When you open the bid panel, Stripe&apos;s payment script loads
        and may set its own cookies for fraud prevention; those are necessary for taking a card and
        Stripe describes them in its own policy. Nothing loads before you open that panel.
      </p>

      <h2>3. Who else sees data</h2>
      <ul>
        <li>
          <strong>Stripe</strong> (payments). Card data and the hold. Stripe Payments Europe Ltd,
          Ireland.
        </li>
        <li>
          <strong>Molted Mail</strong> (email delivery), also operated by {COMPANY.name}, which in turn
          uses established email delivery providers to send the two transactional emails above.
        </li>
        <li>
          <strong>The print service</strong> that prints the winning mug receives the winning logo and
          nothing else.
        </li>
        <li>
          <strong>Our hosting provider</strong>, where the site and its database run, inside the EU.
        </li>
      </ul>
      <p>
        We do not sell data, and we do not share it with anyone else unless the law requires it.
        Where a provider processes data outside the EEA, it does so under the European
        Commission&apos;s standard contractual clauses or an adequacy decision.
      </p>

      <h2>4. How long we keep it</h2>
      <ul>
        <li>Bids, sponsor names, links and logos: for as long as the site is online, as its public record. Losing bidders&apos; logos may be removed on request.</li>
        <li>Email addresses: deleted 30 days after the auction closes.</li>
        <li>Payment references: for as long as Swedish bookkeeping law requires (seven years) for captured payments; released holds are kept only as part of the bid record.</li>
        <li>Viewer session ids: minutes. Server logs: at most 30 days.</li>
      </ul>

      <h2>5. Your rights</h2>
      <p>
        Under the GDPR you can ask us for a copy of your data, ask us to correct or delete it, object
        to processing based on legitimate interest, and ask for it in a portable format. Email{" "}
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> and we will answer within a month.
        If you are not happy with how we handle it, you can complain to the Swedish Authority for
        Privacy Protection (Integritetsskyddsmyndigheten, IMY) or your own country&apos;s supervisory
        authority.
      </p>

      <h2>6. Children</h2>
      <p>The service is for businesses. We do not knowingly collect data from anyone under 18.</p>

      <h2>7. Changes</h2>
      <p>
        If this policy changes, the date at the top moves and, if the change matters, we say so on
        the site. The <Link href="/terms">terms of service</Link> cover the auction itself.
      </p>
    </LegalPage>
  );
}
