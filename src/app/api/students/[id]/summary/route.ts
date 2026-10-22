import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canAccessStudent, forbidden, getSession, teacherClassIds, unauthorized } from "@/lib/auth";
import { bad } from "@/lib/http";

/** Name and class for the header on a student's pages. Admins any student, teachers their classes', parents their children. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const session = await getSession();
  if (!session) return unauthorized();

  const s = await db.student.findUnique({
    where: { id },
    select: { firstName: true, lastName: true, admissionNo: true, schoolClassId: true, schoolClass: { select: { name: true, stream: true } } },
  });
  if (!s) return bad("Student not found.", 404);

  const allowed = session.role === "TEACHER" ? (await teacherClassIds(session.userId)).includes(s.schoolClassId) : await canAccessStudent(session, id);
  if (!allowed) return forbidden();

  return NextResponse.json({
    id, name: `${s.firstName} ${s.lastName}`, admissionNo: s.admissionNo, viewer: session.role,
    className: s.schoolClass.stream ? `${s.schoolClass.name} ${s.schoolClass.stream}` : s.schoolClass.name,
  });
}
