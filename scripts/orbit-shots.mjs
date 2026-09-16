// Walk the camera round the room and shoot it at intervals, to check the room
// holds up from every angle. Usage: node scripts/orbit-shots.mjs <url> <outdir>
import { chromium } from "playwright-core";

const url = process.argv[2] ?? "http://localhost:3000";
const outdir = process.argv[3] ?? "shots";
const waits = [2, 10, 20, 30, 45, 60];

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
page.on("pageerror", (e) => console.error("[pageerror]", e.message));
await page.goto(url, { waitUntil: "networkidle" });
await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });

let elapsed = 0;
for (const at of waits) {
  await page.waitForTimeout((at - elapsed) * 1000);
  elapsed = at;
  await page.screenshot({ path: `${outdir}/orbit-${String(at).padStart(2, "0")}s.png` });
  console.log(`shot at ${at}s`);
}
await browser.close();
