import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = process.env.CUPSPONSOR_DATA_DIR ?? path.join(process.cwd(), "data");
fs.mkdirSync(DATA_DIR, { recursive: true });

declare global {
  var __cupsponsorDb: Database.Database | undefined;
}

function open() {
  const db = new Database(path.join(DATA_DIR, "cupsponsor.db"));
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS bids (
      id                TEXT PRIMARY KEY,
      sponsor           TEXT NOT NULL,
      link_url          TEXT,
      logo_path         TEXT NOT NULL,
      amount_cents      INTEGER NOT NULL,
      currency          TEXT NOT NULL DEFAULT 'usd',
      status            TEXT NOT NULL,
      payment_intent_id TEXT,
      created_at        INTEGER NOT NULL,
      released_at       INTEGER,
      captured_at       INTEGER
    );
    CREATE INDEX IF NOT EXISTS bids_status_idx ON bids(status, amount_cents DESC);

    CREATE TABLE IF NOT EXISTS presence (
      session_id TEXT PRIMARY KEY,
      last_seen  INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS presence_seen_idx ON presence(last_seen);

    CREATE TABLE IF NOT EXISTS views (
      day   TEXT PRIMARY KEY,
      count INTEGER NOT NULL DEFAULT 0
    );
  `);
  return db;
}

export const db = globalThis.__cupsponsorDb ?? (globalThis.__cupsponsorDb = open());

/** A bid is one sponsor's standing offer for tomorrow's cup. */
export type BidStatus =
  | "pending"   // payment intent created, card not authorised yet
  | "leading"   // authorised hold, currently owns the spot
  | "outbid"    // beaten by a higher bid, hold released
  | "captured"  // the photo went out, money taken
  | "cancelled"; // withdrawn or expired

export type Bid = {
  id: string;
  sponsor: string;
  link_url: string | null;
  logo_path: string;
  amount_cents: number;
  currency: string;
  status: BidStatus;
  payment_intent_id: string | null;
  created_at: number;
  released_at: number | null;
  captured_at: number | null;
};

export function leadingBid(): Bid | undefined {
  return db.prepare(`SELECT * FROM bids WHERE status = 'leading' ORDER BY amount_cents DESC LIMIT 1`).get() as
    | Bid
    | undefined;
}

export function bidHistory(limit = 25): Bid[] {
  return db
    .prepare(
      `SELECT * FROM bids WHERE status IN ('leading','outbid','captured')
       ORDER BY created_at DESC LIMIT ?`,
    )
    .all(limit) as Bid[];
}

export function getBid(id: string): Bid | undefined {
  return db.prepare(`SELECT * FROM bids WHERE id = ?`).get(id) as Bid | undefined;
}
