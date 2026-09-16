/**
 * Historical eyeballs. Plausible owns the real numbers; if it is not wired up
 * yet we fall back to the local hit counter so the page never shows a hole.
 */
import { db } from "./db";

const SITE = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
const KEY = process.env.PLAUSIBLE_API_KEY;
const HOST = process.env.PLAUSIBLE_HOST ?? "https://plausible.io";

export type Audience = {
  source: "plausible" | "local";
  today: number;
  allTime: number;
  last30Days: number;
};

async function aggregate(period: string): Promise<number | null> {
  if (!SITE || !KEY) return null;
  const url = new URL("/api/v1/stats/aggregate", HOST);
  url.searchParams.set("site_id", SITE);
  url.searchParams.set("period", period);
  url.searchParams.set("metrics", "pageviews");
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${KEY}` },
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { results?: { pageviews?: { value?: number } } };
  return json.results?.pageviews?.value ?? null;
}

export async function audience(): Promise<Audience> {
  const [today, last30Days, allTime] = await Promise.all([
    aggregate("day"),
    aggregate("30d"),
    aggregate("12mo"),
  ]);
  if (today !== null) {
    return { source: "plausible", today, last30Days: last30Days ?? today, allTime: allTime ?? today };
  }
  const day = new Date().toISOString().slice(0, 10);
  const local = db.prepare(`SELECT COALESCE(SUM(count),0) AS n FROM views`).get() as { n: number };
  const dayRow = db.prepare(`SELECT count FROM views WHERE day = ?`).get(day) as { count: number } | undefined;
  const thirty = db
    .prepare(`SELECT COALESCE(SUM(count),0) AS n FROM views WHERE day >= ?`)
    .get(new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10)) as { n: number };
  return { source: "local", today: dayRow?.count ?? 0, last30Days: thirty.n, allTime: local.n };
}
