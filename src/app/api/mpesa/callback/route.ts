import { NextResponse } from "next/server";
import { processCallback } from "@/lib/fees";

/** The callback URL Safaricom would POST to. Public, no auth. */
export async function POST(req: Request) {
  await processCallback(await req.json());
  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
