import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canAccessStudent, forbidden, getSession, teacherClassIds, unauthorized } from "@/lib/auth";
import { buildReport } from "@/lib/report";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const studentId = Number((await params).id);
  const session = await getSession();
  if (!session) return unauthorized();
  // Admins any report; teachers only students in their classes; parents only their own children.
  if (session.role === "TEACHER") {
    const mine = await teacherClassIds(session.userId);
    const st = await db.student.findUnique({ where: { id: studentId }, select: { schoolClassId: true } });
    if (!st || !mine.includes(st.schoolClassId)) return forbidden();
  } else if (!(await canAccessStudent(session, studentId))) return forbidden();

  const terms = await db.term.findMany({ orderBy: { startsOn: "desc" } });
  if (terms.length === 0) return NextResponse.json({ terms: [], report: null });

  const wanted = Number(new URL(req.url).searchParams.get("termId"));
  const term = terms.find((t) => t.id === wanted) ?? terms.find((t) => t.isCurrent) ?? terms[0];

  return NextResponse.json({
    terms: terms.map((t) => ({ id: t.id, label: `Term ${t.termNumber}, ${t.academicYear}` })),
    termId: term.id,
    report: await buildReport(studentId, term.id),
  });
}
