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

const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full overflow-hidden">
        {children}
        {plausibleDomain && (
          <Script
            defer
            data-domain={plausibleDomain}
            src={`${process.env.NEXT_PUBLIC_PLAUSIBLE_HOST ?? "https://plausible.io"}/js/script.js`}
          />
        )}
      </body>
    </html>
  );
}
