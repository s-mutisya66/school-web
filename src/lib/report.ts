import { db } from "./db";
import { gradeFor, gradeFromPoints } from "./grading";

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const r1 = (n: number) => Math.round(n * 10) / 10;

export async function buildReport(studentId: number, termId: number) {
  const student = await db.student.findUniqueOrThrow({ where: { id: studentId }, include: { schoolClass: true } });
  const exams = await db.exam.findMany({ where: { termId }, orderBy: { id: "asc" } });

  // Marks for the whole class, so we can work out class averages and the student's position.
  const marks = await db.mark.findMany({
    where: {
      exam: { termId },
      student: { schoolClassId: student.schoolClassId, OR: [{ status: "active" }, { id: studentId }] },
    },
    include: { exam: { select: { outOf: true } }, subject: { select: { id: true, name: true } } },
  });

  // studentId -> subjectId -> percentages across exams
  const pcts = new Map<number, Map<number, number[]>>();
  const names = new Map<number, string>();
  for (const m of marks) {
    names.set(m.subject.id, m.subject.name);
    const bySubject = pcts.get(m.studentId) ?? new Map<number, number[]>();
    bySubject.set(m.subject.id, [...(bySubject.get(m.subject.id) ?? []), (m.score / m.exam.outOf) * 100]);
    pcts.set(m.studentId, bySubject);
  }
  const subjectAvg = (sid: number, subjectId: number) => {
    const v = pcts.get(sid)?.get(subjectId);
    return v ? mean(v) : null;
  };

  const mine = pcts.get(studentId) ?? new Map<number, number[]>();
  const subjects = [...mine.keys()]
    .map((subjectId) => {
      const average = subjectAvg(studentId, subjectId)!;
      const classAvgs = [...pcts.keys()].map((sid) => subjectAvg(sid, subjectId)).filter((x): x is number => x !== null);
      return {
        name: names.get(subjectId)!,
        scores: exams.map((e) => ({ examId: e.id, outOf: e.outOf, score: marks.find((m) => m.studentId === studentId && m.subject.id === subjectId && m.examId === e.id)?.score ?? null })),
        average: r1(average),
        ...gradeFor(average),
        classAverage: r1(mean(classAvgs)),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  let summary = null;
  if (subjects.length) {
    const overall = (sid: number) => mean([...(pcts.get(sid)?.keys() ?? [])].map((s) => subjectAvg(sid, s)!));
    const mine_ = overall(studentId);
    const everyone = [...pcts.keys()].map(overall);
    summary = {
      meanPercent: r1(mine_),
      meanGrade: gradeFromPoints(mean(subjects.map((s) => s.points))),
      position: 1 + everyone.filter((x) => x > mine_ + 1e-9).length, // ties share a position
      classSize: everyone.length,
    };
  }

  return {
    student: { id: student.id, name: `${student.firstName} ${student.lastName}`, admissionNo: student.admissionNo, className: student.schoolClass.stream ? `${student.schoolClass.name} ${student.schoolClass.stream}` : student.schoolClass.name },
    exams: exams.map((e) => ({ id: e.id, name: e.name, outOf: e.outOf })),
    subjects,
    summary,
  };
}
