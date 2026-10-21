import { db } from "./db";
import { buildPerformance } from "./performance";
import { parseDay, todayNairobi } from "./dates";
import { classLabel } from "./student-csv";

async function currentTerm() {
  return (await db.term.findFirst({ where: { isCurrent: true } })) ?? (await db.term.findFirst({ orderBy: { startsOn: "desc" } }));
}

export async function buildAdminDashboard() {
  const term = await currentTerm();
  const [students, teachers, parents, paid, invoices, genders, recent, perf] = await Promise.all([
    db.student.count({ where: { status: "active" } }),
    db.user.count({ where: { role: "TEACHER" } }),
    db.user.count({ where: { role: "PARENT" } }),
    db.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
    db.invoice.aggregate({ _sum: { amountDue: true, amountPaid: true } }),
    db.student.groupBy({ by: ["gender"], where: { status: "active" }, _count: { _all: true } }),
    db.payment.findMany({
      where: { status: "PAID" }, orderBy: { paidAt: "desc" }, take: 5,
      select: { amount: true, paidAt: true, student: { select: { firstName: true, lastName: true } } },
    }),
    term ? buildPerformance(term.id) : Promise.resolve(null),
  ]);

  const examId = perf?.examId ?? null;
  const examName = perf?.exams.find((e) => e.id === examId)?.name ?? null;
  const count = (g: "MALE" | "FEMALE" | null) => genders.find((x) => x.gender === g)?._count._all ?? 0;
  const star = perf
    ? perf.forms.flatMap((f) => f.detail?.rows ?? []).sort((a, b) => b.mean - a.mean).slice(0, 5)
        .map((r) => ({ id: r.id, name: r.name, gender: r.gender, admissionNo: r.admissionNo, className: r.className, total: r.total, mean: r.mean, grade: r.grade }))
    : [];

  return {
    termLabel: term ? `Term ${term.termNumber}, ${term.academicYear}` : null,
    stats: {
      students, teachers, parents,
      collected: paid._sum.amount ?? 0,
      outstanding: (invoices._sum.amountDue ?? 0) - (invoices._sum.amountPaid ?? 0),
    },
    chart: {
      labels: perf?.exams.map((e) => e.name) ?? [],
      series: perf?.forms.map((f) => ({ name: f.name, values: f.trend.map((t) => t.mean) })) ?? [],
    },
    gender: { male: count("MALE"), female: count("FEMALE"), unknown: count(null) },
    star: { examName: examName, rows: star },
    recent: recent.map((p) => ({ who: `${p.student.firstName} ${p.student.lastName}`, amount: p.amount, at: p.paidAt ? p.paidAt.toISOString() : null })),
  };
}

export async function buildTeacherDashboard(userId: number) {
  const assignments = await db.teachingAssignment.findMany({ where: { teacherId: userId }, include: { schoolClass: true, subject: true } });
  const classIds = [...new Set(assignments.map((a) => a.schoolClassId))];
  const today = parseDay(todayNairobi())!;

  const [counts, marked] = await Promise.all([
    db.student.groupBy({ by: ["schoolClassId"], where: { schoolClassId: { in: classIds }, status: "active" }, _count: { _all: true } }),
    db.attendance.groupBy({ by: ["schoolClassId"], where: { schoolClassId: { in: classIds }, date: today }, _count: { _all: true } }),
  ]);

  const classes = classIds
    .map((id) => {
      const rows = assignments.filter((a) => a.schoolClassId === id);
      const allSubjects = rows.some((r) => r.subjectId === null);
      return {
        id,
        label: classLabel(rows[0].schoolClass),
        students: counts.find((c) => c.schoolClassId === id)?._count._all ?? 0,
        subjects: allSubjects ? "All subjects" : rows.map((r) => r.subject!.name).sort().join(", "),
        registerTaken: (marked.find((m) => m.schoolClassId === id)?._count._all ?? 0) > 0,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));

  return {
    stats: { classes: classes.length, students: classes.reduce((n, c) => n + c.students, 0), waiting: classes.filter((c) => !c.registerTaken).length },
    classes,
  };
}
