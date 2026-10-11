import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function GET() {
  const guard = await requireRole("ADMIN", "TEACHER");
  if (guard instanceof NextResponse) return guard;
  const terms = await db.term.findMany({ orderBy: { startsOn: "desc" } });
  return NextResponse.json(terms.map((t) => ({ id: t.id, label: `Term ${t.termNumber}, ${t.academicYear}`, isCurrent: t.isCurrent })));
}
