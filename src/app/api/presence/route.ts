import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const WINDOW_MS = 45_000;

/** Heartbeat in, live count out. Sessions older than the window fall off. */
export async function POST(req: Request) {
  const { sessionId } = await req.json().catch(() => ({ sessionId: null }));
  const now = Date.now();
  if (typeof sessionId === "string" && sessionId.length > 0 && sessionId.length <= 64) {
    db.prepare(
      `INSERT INTO presence (session_id, last_seen) VALUES (?, ?)
       ON CONFLICT(session_id) DO UPDATE SET last_seen = excluded.last_seen`,
    ).run(sessionId, now);
  }
  db.prepare(`DELETE FROM presence WHERE last_seen < ?`).run(now - WINDOW_MS * 4);
  const { n } = db.prepare(`SELECT COUNT(*) AS n FROM presence WHERE last_seen >= ?`).get(now - WINDOW_MS) as {
    n: number;
  };
  return NextResponse.json({ watching: n });
}
