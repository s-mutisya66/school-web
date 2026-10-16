import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { bad } from "@/lib/http";

/**
 * PUT { assignments: [{ classId, subjectIds }] } replaces everything a teacher is assigned to.
 * subjectIds = null means all subjects in that class; otherwise a non-empty list of subject ids.
 * An admin can run this again at any time to change the assignments.
 */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireRole("ADMIN");
  if (guard instanceof NextResponse) return guard;

  const userId = Number((await params).id);
  const { assignments } = await req.json().catch(() => ({}));
  if (!Array.isArray(assignments)) return bad("Choose classes from the list.");

  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) return bad("User not found.", 404);
  if (user.role !== "TEACHER") return bad("Only teachers can be assigned to classes.");

  const classIds: number[] = assignments.map((a: { classId: number }) => a.classId);
  if (classIds.some((x: unknown) => !Number.isInteger(x)) || new Set(classIds).size !== classIds.length) return bad("Choose each class once.");

  const rows: { teacherId: number; schoolClassId: number; subjectId: number | null }[] = [];
  for (const a of assignments as { classId: number; subjectIds: number[] | null }[]) {
    if (a.subjectIds === null) { rows.push({ teacherId: userId, schoolClassId: a.classId, subjectId: null }); continue; }
    if (!Array.isArray(a.subjectIds) || a.subjectIds.length === 0 || a.subjectIds.some((x) => !Number.isInteger(x))) {
      return bad("For each class, choose all subjects or at least one subject.");
    }
    for (const sid of new Set(a.subjectIds)) rows.push({ teacherId: userId, schoolClassId: a.classId, subjectId: sid });
  }

  const subjectIds = [...new Set(rows.map((r) => r.subjectId).filter((x): x is number => x !== null))];
  const [classCount, subjectCount] = await Promise.all([
    db.schoolClass.count({ where: { id: { in: classIds } } }),
    db.subject.count({ where: { id: { in: subjectIds } } }),
  ]);
  if (classCount !== classIds.length || subjectCount !== subjectIds.length) return bad("Some of those classes or subjects no longer exist.");

  await db.$transaction([db.teachingAssignment.deleteMany({ where: { teacherId: userId } }), db.teachingAssignment.createMany({ data: rows })]);
  return NextResponse.json({ saved: rows.length });
}
