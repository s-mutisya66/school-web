import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { buildPerformance } from "@/lib/performance";

/** GET ?period=term:3 or year:2026. Admin only. */
export async function GET(req: Request) {
  const guard = await requireRole("ADMIN");
  if (guard instanceof NextResponse) return guard;

  const terms = await db.term.findMany({ orderBy: { startsOn: "desc" } });
  if (terms.length === 0) return NextResponse.json({ periods: [], selected: null, forms: [] });

  const years = [...new Set(terms.map((t) => t.academicYear))];
  const periods = [
    ...terms.map((t) => ({ value: `term:${t.id}`, label: `Term ${t.termNumber}, ${t.academicYear}` })),
    ...years.map((y) => ({ value: `year:${y}`, label: `Full year ${y}` })),
  ];

  const wanted = new URL(req.url).searchParams.get("period");
  const selected = periods.find((p) => p.value === wanted)?.value ?? `term:${(terms.find((t) => t.isCurrent) ?? terms[0]).id}`;
  const [kind, id] = selected.split(":");
  const termIds = kind === "term" ? [Number(id)] : terms.filter((t) => t.academicYear === id).map((t) => t.id);

  return NextResponse.json({ periods, selected, forms: await buildPerformance(termIds) });
}
