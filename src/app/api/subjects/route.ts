import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { bad, uniqueError } from "@/lib/http";

export async function GET() {
  const guard = await requireRole("ADMIN", "TEACHER");
  if (guard instanceof NextResponse) return guard;
  return NextResponse.json(await db.subject.findMany({ orderBy: { name: "asc" } }));
}

export async function POST(req: Request) {
  const guard = await requireRole("ADMIN");
  if (guard instanceof NextResponse) return guard;
  const { name } = await req.json().catch(() => ({}));
  if (typeof name !== "string" || !name.trim()) return bad("Enter a subject name.");
  try {
    return NextResponse.json(await db.subject.create({ data: { name: name.trim() } }), { status: 201 });
  } catch (e) {
    return uniqueError(e, "That subject already exists.");
  }
}
