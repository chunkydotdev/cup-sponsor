// Drive the whole bid flow against the running dev server and shoot the result.
// Usage: node scripts/drive.mjs <baseUrl> <logo.png> <outdir>
import { chromium } from "playwright-core";

const base = process.argv[2] ?? "http://localhost:3000";
const logo = process.argv[3] ?? "scripts/fixtures/test-logo.png";
const outdir = process.argv[4] ?? "shots";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

await page.goto(base, { waitUntil: "networkidle" });
await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
await page.waitForTimeout(2500);
await page.screenshot({ path: `${outdir}/drive-0-stage.png` });

await page.getByRole("button", { name: /Take the cup/ }).click();
await page.setInputFiles('input[type="file"]', logo);
await page.waitForSelector("text=it is on the cup already", { timeout: 15000 });
await page.fill('input[placeholder="Acme Inc."]', "Acme Inc.");
await page.fill('input[placeholder="https://acme.com"]', "https://acme.example");
await page.waitForTimeout(1200);
await page.screenshot({ path: `${outdir}/drive-1-bid.png` });

await page.getByRole("button", { name: /Take the spot|Continue to hold/ }).click();
await page.waitForSelector("text=The cup is yours", { timeout: 20000 });
await page.keyboard.press("Escape");
await page.waitForTimeout(1500);
await page.screenshot({ path: `${outdir}/drive-2-placed.png` });

// Reload: the leader's logo must come back from the server, not from local state.
await page.reload({ waitUntil: "networkidle" });
await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
await page.waitForSelector("text=is on the cup at", { timeout: 15000 });
await page.waitForTimeout(2500);
await page.screenshot({ path: `${outdir}/drive-3-reloaded.png` });

console.log(errors.length ? `PAGE ERRORS:\n${errors.join("\n")}` : "no page errors");
console.log("drive complete");
await browser.close();
