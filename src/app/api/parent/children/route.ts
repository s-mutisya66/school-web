import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, unauthorized } from "@/lib/auth";

/** The signed-in parent's children. */
export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();

  const children = await db.student.findMany({
    where: { guardians: { some: { id: session.userId } } },
    select: { id: true, firstName: true, lastName: true, admissionNo: true, schoolClass: { select: { name: true, stream: true } } },
    orderBy: { firstName: "asc" },
  });
  return NextResponse.json(children.map((c) => ({ ...c, className: c.schoolClass.stream ? `${c.schoolClass.name} ${c.schoolClass.stream}` : c.schoolClass.name })));
}
