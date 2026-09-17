// Shoot the room with the cup, at OG size, with the HUD out of the way.
// Usage: node scripts/og-shot.mjs <baseUrl> [out.png]
import { chromium } from "playwright-core";

const base = process.argv[2] ?? "http://localhost:3000";
const out = process.argv[3] ?? "public/og.png";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
page.on("pageerror", (e) => console.error("[pageerror]", e.message));
await page.goto(base, { waitUntil: "networkidle" });
await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
// The HUD is the overlay that holds the h1; the scrims are its siblings. Hide them all.
await page.evaluate(() => {
  const h1 = document.querySelector("h1");
  const hud = h1?.closest(".absolute");
  if (hud) hud.style.display = "none";
  document.querySelectorAll(".bg-gradient-to-b, .bg-gradient-to-t").forEach((el) => (el.style.display = "none"));
});
await page.waitForTimeout(3000);
await page.screenshot({ path: out });
console.log("shot ->", out);
await browser.close();
