import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canAccessStudent, forbidden, getSession, unauthorized } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const studentId = Number((await params).id);
  const session = await getSession();
  if (!session) return unauthorized();
  if (!(await canAccessStudent(session, studentId))) return forbidden();

  const [counts, recent] = await Promise.all([
    db.attendance.groupBy({ by: ["status"], where: { studentId }, _count: { _all: true } }),
    db.attendance.findMany({ where: { studentId }, orderBy: { date: "desc" }, take: 30, select: { date: true, status: true } }),
  ]);

  const n = (s: string) => counts.find((c) => c.status === s)?._count._all ?? 0;
  const present = n("PRESENT"), late = n("LATE"), absent = n("ABSENT"), excused = n("EXCUSED");
  // Excused days are left out of the rate; late counts as attended.
  const counted = present + late + absent;

  return NextResponse.json({
    summary: { present, late, absent, excused, rate: counted ? Math.round(((present + late) / counted) * 100) : null },
    recent,
  });
}
