import { NextResponse } from "next/server";
import { readSpot } from "@/lib/spot-server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(readSpot());
}
