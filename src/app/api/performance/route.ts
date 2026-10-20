import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { buildPerformance } from "@/lib/performance";

/** GET ?termId=3&examId=7. Admin only. Returns every exam's trend and the full detail for one exam. */
export async function GET(req: Request) {
  const guard = await requireRole("ADMIN");
  if (guard instanceof NextResponse) return guard;

  const terms = await db.term.findMany({ orderBy: { startsOn: "desc" } });
  if (terms.length === 0) return NextResponse.json({ terms: [], termId: null, exams: [], examId: null, forms: [] });

  const q = new URL(req.url).searchParams;
  const term = terms.find((t) => t.id === Number(q.get("termId"))) ?? terms.find((t) => t.isCurrent) ?? terms[0];
  const result = await buildPerformance(term.id, Number(q.get("examId")) || undefined);

  return NextResponse.json({
    terms: terms.map((t) => ({ id: t.id, label: `Term ${t.termNumber}, ${t.academicYear}` })),
    termId: term.id,
    ...result,
  });
}
