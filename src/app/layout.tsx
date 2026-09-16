import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "cupsponsor — one mug, one logo, every morning",
  description:
    "Every morning there is a photo of a coffee cup. The highest bidder's logo is on it. Bid to take the spot; you are only charged if your logo makes it to the photo.",
};

const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
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
