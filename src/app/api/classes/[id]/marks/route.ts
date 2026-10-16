import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canAccessClass, canMarkSubject, forbidden, requireRole } from "@/lib/auth";
import { bad } from "@/lib/http";

// Teachers can only reach the classes they're assigned to.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireRole("ADMIN", "TEACHER");
  if (guard instanceof NextResponse) return guard;

  const classId = Number((await params).id);
  if (!(await canAccessClass(guard, classId))) return forbidden();
  const q = new URL(req.url).searchParams;
  const examId = Number(q.get("examId")), subjectId = Number(q.get("subjectId"));
  if (!examId || !subjectId) return bad("Choose an exam and a subject.");
  if (!(await canMarkSubject(guard, classId, subjectId))) return forbidden();

  const exam = await db.exam.findUnique({ where: { id: examId } });
  if (!exam) return bad("Exam not found.", 404);

  const students = await db.student.findMany({
    where: { schoolClassId: classId, status: "active" },
    select: { id: true, admissionNo: true, firstName: true, lastName: true, marks: { where: { examId, subjectId }, select: { score: true } } },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });

  return NextResponse.json({
    outOf: exam.outOf,
    rows: students.map(({ marks, ...s }) => ({ ...s, score: marks[0]?.score ?? null })),
  });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireRole("ADMIN", "TEACHER");
  if (guard instanceof NextResponse) return guard;

  const classId = Number((await params).id);
  if (!(await canAccessClass(guard, classId))) return forbidden();
  const b = await req.json().catch(() => ({}));
  const examId = Number(b.examId), subjectId = Number(b.subjectId);
  const records: { studentId: number; score: number }[] = Array.isArray(b.records) ? b.records : [];
  if (!examId || !subjectId) return bad("Choose an exam and a subject.");
  if (!(await canMarkSubject(guard, classId, subjectId))) return forbidden();
  if (records.length === 0) return bad("Enter at least one mark before saving.");

  const exam = await db.exam.findUnique({ where: { id: examId } });
  if (!exam) return bad("Exam not found.", 404);
  if (records.some((r) => !Number.isInteger(r.score) || r.score < 0 || r.score > exam.outOf)) {
    return bad(`Marks must be whole numbers from 0 to ${exam.outOf}.`);
  }

  const inClass = new Set((await db.student.findMany({ where: { schoolClassId: classId }, select: { id: true } })).map((s) => s.id));
  if (records.some((r) => !inClass.has(Number(r.studentId)))) return bad("Some students aren't in this class.");

  await db.$transaction(
    records.map((r) =>
      db.mark.upsert({
        where: { examId_subjectId_studentId: { examId, subjectId, studentId: Number(r.studentId) } },
        create: { examId, subjectId, studentId: Number(r.studentId), score: r.score },
        update: { score: r.score },
      }),
    ),
  );
  return NextResponse.json({ saved: records.length });
}
