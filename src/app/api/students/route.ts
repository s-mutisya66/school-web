import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { bad, uniqueError } from "@/lib/http";
import { resolveGuardians } from "@/lib/guardians";

const include = {
  schoolClass: true,
  guardians: { select: { id: true, name: true, email: true } },
};

export async function GET(req: Request) {
  const guard = await requireRole("ADMIN", "TEACHER");
  if (guard instanceof NextResponse) return guard;

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const classId = Number(url.searchParams.get("classId"));

  const students = await db.student.findMany({
    where: {
      ...(classId ? { schoolClassId: classId } : {}),
      ...(q
        ? { OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { admissionNo: { contains: q, mode: "insensitive" } },
          ] }
        : {}),
    },
    include,
    orderBy: [{ schoolClassId: "asc" }, { firstName: "asc" }],
    take: 200,
  });
  return NextResponse.json(students);
}

export async function POST(req: Request) {
  const guard = await requireRole("ADMIN");
  if (guard instanceof NextResponse) return guard;

  const b = await req.json().catch(() => ({}));
  const { admissionNo, firstName, lastName, schoolClassId } = b;
  if (![admissionNo, firstName, lastName].every((v) => typeof v === "string" && v.trim()) || !Number(schoolClassId)) {
    return bad("Admission number, first name, last name and class are required.");
  }

  const g = await resolveGuardians(b.guardianEmails);
  if ("error" in g) return bad(g.error!);

  try {
    const student = await db.student.create({
      data: {
        admissionNo: admissionNo.trim(), firstName: firstName.trim(), lastName: lastName.trim(),
        schoolClassId: Number(schoolClassId),
        ...(g.ids ? { guardians: { connect: g.ids } } : {}),
      },
      include,
    });
    return NextResponse.json(student, { status: 201 });
  } catch (e) {
    return uniqueError(e, "That admission number is already in use.");
  }
}
