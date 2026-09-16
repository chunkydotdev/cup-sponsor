// Screenshot the running dev server with the system Chrome (no browser download).
// Usage: node scripts/shoot.mjs <url> <out.png> [width] [height] [--full]
import { chromium } from "playwright-core";

const url = process.argv[2] ?? "http://localhost:3000";
const out = process.argv[3] ?? "shots/shot.png";
const width = Number(process.argv[4] ?? 1280);
const height = Number(process.argv[5] ?? 900);

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
page.on("console", (m) => m.type() === "error" && console.error("[page]", m.text()));
page.on("pageerror", (e) => console.error("[pageerror]", e.message));
await page.goto(url, { waitUntil: "networkidle" });
await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
// Let the WebGL scene draw a few frames before we grab it.
await page.waitForTimeout(2500);
await page.screenshot({ path: out, fullPage: process.argv.includes("--full") });
console.log("shot ->", out);
await browser.close();
