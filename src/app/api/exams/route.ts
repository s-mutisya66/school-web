import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { bad, uniqueError } from "@/lib/http";

export async function GET(req: Request) {
  const guard = await requireRole("ADMIN", "TEACHER");
  if (guard instanceof NextResponse) return guard;
  const termId = Number(new URL(req.url).searchParams.get("termId"));
  return NextResponse.json(await db.exam.findMany({ where: termId ? { termId } : {}, orderBy: { id: "asc" } }));
}

export async function POST(req: Request) {
  const guard = await requireRole("ADMIN");
  if (guard instanceof NextResponse) return guard;
  const b = await req.json().catch(() => ({}));
  const outOf = b.outOf === undefined ? 100 : Number(b.outOf);
  if (!Number(b.termId) || typeof b.name !== "string" || !b.name.trim()) return bad("Choose a term and enter an exam name.");
  if (!Number.isInteger(outOf) || outOf < 1 || outOf > 1000) return bad("Total marks must be a whole number from 1 to 1000.");
  try {
    return NextResponse.json(await db.exam.create({ data: { termId: Number(b.termId), name: b.name.trim(), outOf } }), { status: 201 });
  } catch (e) {
    return uniqueError(e, "That term already has an exam with this name.");
  }
}
