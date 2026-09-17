import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY, LegalPage } from "@/components/Legal";

export const metadata: Metadata = {
  title: "Terms — cupsponsor",
  description: "The rules of the cupsponsor auction: what a bid is, what a hold is, and what you get.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of service" updated="17 September 2026">
      <p>
        cupsponsor is one auction for one coffee mug, run by {COMPANY.name} (org. nr {COMPANY.orgNumber}),{" "}
        {COMPANY.address}. These terms are the deal. By placing a bid you accept them.
      </p>

      <h2>1. What is being sold</h2>
      <p>
        Whoever holds the highest authorised bid when bidding closes at 07:30 (Europe/Stockholm) on 20
        September 2026 gets their logo printed on one real coffee mug. That mug is then the one in the
        morning photograph published on {COMPANY.site} every day for the fourteen days after the print
        is ready. That is the whole product: one printed mug, and its appearance in those photographs.
      </p>
      <p>
        We do not promise any particular audience, number of views, or business result. The viewer
        counts on the site are shown for interest and are not a guarantee of anything.
      </p>

      <h2>2. How bidding works</h2>
      <ul>
        <li>An empty cup costs USD 50. After that, taking the cup off whoever holds it costs double what they are holding it at.</li>
        <li>A bid is an offer to pay that amount if you are still holding the cup when bidding closes. It cannot be withdrawn once placed.</li>
        <li>When you bid, our payment processor (Stripe) authorises the amount on your card. This is a hold, not a charge.</li>
        <li>The moment someone places a higher authorised bid, your hold is cancelled and released. How quickly the money reappears is up to your bank, usually within a few days.</li>
        <li>When bidding closes, the standing hold is captured. That is the only time money is taken.</li>
        <li>If a card fails to authorise, the bid does not count. If a higher bid lands while your card is authorising, your hold is released and you are told.</li>
      </ul>

      <h2>3. Your logo</h2>
      <p>By uploading a logo you confirm that:</p>
      <ul>
        <li>you own it or have the right to use it this way, and it does not infringe anyone else&apos;s rights;</li>
        <li>it is not unlawful, hateful, pornographic, defamatory, or misleading, and does not promote anything illegal;</li>
        <li>the name and link you give are yours to give.</li>
      </ul>
      <p>
        You grant {COMPANY.name} a non-exclusive, worldwide, royalty-free licence to reproduce the logo on
        the mug, to photograph it, and to publish and share those photographs on {COMPANY.site} and in
        our own social channels, for as long as those photographs are online. You also agree that your
        sponsor name, link, logo and bid amount are shown publicly on the site as part of the auction
        record.
      </p>
      <p>
        We may refuse or remove any logo, and release its hold, if we judge it to breach the points
        above or to be something we do not want on a mug. If that happens after capture, we refund the
        amount in full and that is the end of it.
      </p>

      <h2>4. Printing and photographs</h2>
      <p>
        The mug is printed by a third-party print service after bidding closes. Colours, size and
        placement will be close to the preview on the site but not identical; a preview on a screen
        and a print on ceramic are different things. The photographs are taken by us, at home, and we
        decide how they look. If, for reasons within our control, the mug is not printed or the
        photographs are not published, we refund the captured amount in full. That refund is the
        limit of what we owe you.
      </p>

      <h2>5. Prices, tax and invoices</h2>
      <p>
        Prices are in US dollars. The amount you bid is the amount held and, if you win, charged.{" "}
        {COMPANY.name} is a Swedish company and accounts for VAT on that amount where Swedish law
        requires it. If you are a VAT-registered business outside Sweden and need an invoice with your
        VAT number on it, email <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> after bidding
        closes.
      </p>

      <h2>6. Who this is for</h2>
      <p>
        This service is aimed at businesses and organisations buying advertising. If you bid as a
        private individual you are buying a custom-printed item made to your specification, which is
        exempt from the statutory right of withdrawal under the Swedish Distance Contracts Act (lag
        (2005:59) om distansavtal och avtal utanför affärslokaler, 2 kap. 11 §). Nothing here removes
        rights you have under mandatory consumer law.
      </p>

      <h2>7. The service</h2>
      <p>
        The site is provided as it is. We may take it offline, change it, or end the auction early if
        we have to; if we end it early, every standing hold is released and nothing is charged. We are
        not liable for loss of profit, business or goodwill, and our total liability to you for
        anything arising from this service is capped at the amount you actually paid.
      </p>

      <h2>8. Changes</h2>
      <p>
        We may update these terms. The version that applies to a bid is the one in force when the bid
        was placed. Material changes will be noted at the top of this page.
      </p>

      <h2>9. Law and disputes</h2>
      <p>
        Swedish law applies. Disputes go to Göteborgs tingsrätt (Gothenburg District Court) unless
        mandatory law gives you a different forum. Consumers in the EU can also use the European
        Commission&apos;s online dispute resolution platform.
      </p>

      <h2>10. Contact</h2>
      <p>
        {COMPANY.name}, {COMPANY.address}. <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.
        How we handle your data is in the <Link href="/privacy">privacy policy</Link>.
      </p>
    </LegalPage>
  );
}
