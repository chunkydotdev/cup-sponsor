import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "cupsponsor — your logo on the mug, every morning for two weeks",
  description:
    "One auction for one coffee mug. Whoever holds the highest bid on 20 September gets their logo printed on it for real, and that mug is in every morning photo for the fortnight after. Bids are held, never charged — get doubled and your money is back the same second.",
};

/**
 * Self-hosted Plausible. The newer script identifies the site by its own
 * filename rather than a data-domain attribute, so the whole URL is the
 * setting. Inlined at build time like every NEXT_PUBLIC_ value.
 */
const plausibleSrc = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full overflow-hidden">
        {children}
        {plausibleSrc && (
          <>
            <Script async src={plausibleSrc} strategy="afterInteractive" />
            {/* Queues events fired before the script has finished loading. */}
            <Script id="plausible-init" strategy="afterInteractive">
              {`window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init()`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
