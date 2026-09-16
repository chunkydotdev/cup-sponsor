import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audience } from "@/lib/plausible";

export const dynamic = "force-dynamic";

/** Count the hit locally (Plausible wins when it is configured), then report. */
export async function POST() {
  const day = new Date().toISOString().slice(0, 10);
  db().prepare(
    `INSERT INTO views (day, count) VALUES (?, 1)
     ON CONFLICT(day) DO UPDATE SET count = count + 1`,
  ).run(day);
  return NextResponse.json(await audience());
}

export async function GET() {
  return NextResponse.json(await audience());
}
