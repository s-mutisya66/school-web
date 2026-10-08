import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { bad } from "@/lib/http";
import { parseDay, todayNairobi } from "@/lib/dates";

const STATUSES = ["PRESENT", "ABSENT", "LATE", "EXCUSED"] as const;

// TODO: once teachers are assigned to classes, limit teachers to their own classes.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireRole("ADMIN", "TEACHER");
  if (guard instanceof NextResponse) return guard;

  const classId = Number((await params).id);
  const date = parseDay(new URL(req.url).searchParams.get("date"));
  if (!date) return bad("Choose a valid date.");

  const students = await db.student.findMany({
    where: { schoolClassId: classId, status: "active" },
    select: { id: true, admissionNo: true, firstName: true, lastName: true, attendance: { where: { date }, select: { status: true } } },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });

  return NextResponse.json(
    students.map(({ attendance, ...s }) => ({ ...s, status: attendance[0]?.status ?? null })),
  );
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireRole("ADMIN", "TEACHER");
  if (guard instanceof NextResponse) return guard;

  const classId = Number((await params).id);
  const body = await req.json().catch(() => ({}));
  const date = parseDay(body.date);
  if (!date) return bad("Choose a valid date.");
  if (body.date > todayNairobi()) return bad("You can't mark attendance for a future date.");

  const records: { studentId: number; status: (typeof STATUSES)[number] }[] = Array.isArray(body.records) ? body.records : [];
  if (records.length === 0) return bad("Mark at least one student before saving.");
  if (records.some((r) => !STATUSES.includes(r.status))) return bad("Unknown attendance status.");

  // Only students who are in this class can be marked here.
  const inClass = new Set(
    (await db.student.findMany({ where: { schoolClassId: classId }, select: { id: true } })).map((s) => s.id),
  );
  if (records.some((r) => !inClass.has(Number(r.studentId)))) return bad("Some students aren't in this class.");

  await db.$transaction(
    records.map((r) =>
      db.attendance.upsert({
        where: { studentId_date: { studentId: Number(r.studentId), date } },
        create: { studentId: Number(r.studentId), schoolClassId: classId, date, status: r.status, markedById: guard.userId },
        update: { status: r.status, schoolClassId: classId, markedById: guard.userId },
      }),
    ),
  );

  return NextResponse.json({ saved: records.length });
}
