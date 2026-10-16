import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canAccessClass, forbidden, markableSubjects, requireRole } from "@/lib/auth";

/** The subjects the signed-in user may enter marks for in this class. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireRole("ADMIN", "TEACHER");
  if (guard instanceof NextResponse) return guard;

  const classId = Number((await params).id);
  if (!(await canAccessClass(guard, classId))) return forbidden();

  const allowed = await markableSubjects(guard, classId);
  const subjects = await db.subject.findMany({
    where: allowed === "all" ? {} : { id: { in: allowed } },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return NextResponse.json(subjects);
}
