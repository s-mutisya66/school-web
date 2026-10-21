import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, unauthorized } from "@/lib/auth";
import { buildReport } from "@/lib/report";

/** The signed-in parent's children, each with their fee balance, attendance rate and latest exam result. */
export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();

  const [kids, term] = await Promise.all([
    db.student.findMany({
      where: { guardians: { some: { id: session.userId } } },
      select: { id: true, firstName: true, lastName: true, admissionNo: true, schoolClass: { select: { name: true, stream: true } } },
      orderBy: { firstName: "asc" },
    }),
    db.term.findFirst({ where: { isCurrent: true } }).then((t) => t ?? db.term.findFirst({ orderBy: { startsOn: "desc" } })),
  ]);

  const children = await Promise.all(
    kids.map(async (c) => {
      const [invoices, attendance, report] = await Promise.all([
        db.invoice.aggregate({ where: { studentId: c.id }, _sum: { amountDue: true, amountPaid: true } }),
        db.attendance.groupBy({ by: ["status"], where: { studentId: c.id }, _count: { _all: true } }),
        term ? buildReport(c.id, term.id) : Promise.resolve(null),
      ]);

      const n = (s: string) => attendance.find((a) => a.status === s)?._count._all ?? 0;
      const attended = n("PRESENT") + n("LATE"), counted = attended + n("ABSENT"); // excused days aren't counted
      const latest = report ? [...report.exams].filter((e) => e.mean !== null).pop() : undefined;

      return {
        id: c.id, firstName: c.firstName, lastName: c.lastName, admissionNo: c.admissionNo,
        className: c.schoolClass.stream ? `${c.schoolClass.name} ${c.schoolClass.stream}` : c.schoolClass.name,
        balance: (invoices._sum.amountDue ?? 0) - (invoices._sum.amountPaid ?? 0),
        attendanceRate: counted ? Math.round((attended / counted) * 100) : null,
        latest: latest
          ? { exam: latest.name, mean: latest.mean, grade: latest.grade, classPosition: latest.classPosition, classSize: latest.classSize, formPosition: latest.formPosition, formSize: latest.formSize }
          : null,
      };
    }),
  );

  return NextResponse.json(children);
}
