import { db } from "./db";
import { gradeFor, gradeFromPoints } from "./grading";
import { classLabel } from "./student-csv";

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const r1 = (n: number) => Math.round(n * 10) / 10;
const EPS = 1e-9;

/** Positions for a list already sorted high to low; ties share a position. */
function withPositions<T extends { mean: number }>(sorted: T[]) {
  let pos = 0, prev = Infinity;
  return sorted.map((x, i) => {
    if (x.mean < prev - EPS) { pos = i + 1; prev = x.mean; }
    return { ...x, position: pos };
  });
}

/**
 * Class and year-group performance for the given terms. "Year group" means the class name
 * (Form 1, Form 2, ...), so every stream of a form is ranked together. A subject's score is
 * the mean of its exam percentages; a student's mean is the mean of their subject scores.
 */
export async function buildPerformance(termIds: number[]) {
  const [marks, classes] = await Promise.all([
    db.mark.findMany({
      where: { exam: { termId: { in: termIds } }, student: { status: "active" } },
      select: {
        score: true,
        exam: { select: { outOf: true } },
        subject: { select: { id: true, name: true } },
        student: { select: { id: true, firstName: true, lastName: true, admissionNo: true, schoolClassId: true } },
      },
    }),
    db.schoolClass.findMany(),
  ]);
  const classById = new Map(classes.map((c) => [c.id, c]));

  const subjectNames = new Map<number, string>();
  const perStudent = new Map<number, { name: string; admissionNo: string; classId: number; pcts: Map<number, number[]> }>();
  for (const m of marks) {
    subjectNames.set(m.subject.id, m.subject.name);
    const s = perStudent.get(m.student.id) ?? { name: `${m.student.firstName} ${m.student.lastName}`, admissionNo: m.student.admissionNo, classId: m.student.schoolClassId, pcts: new Map() };
    s.pcts.set(m.subject.id, [...(s.pcts.get(m.subject.id) ?? []), (m.score / m.exam.outOf) * 100]);
    perStudent.set(m.student.id, s);
  }

  const students = [...perStudent].map(([id, s]) => {
    const subjectAvgs = [...s.pcts].map(([sid, v]) => [sid, mean(v)] as const);
    return {
      id, name: s.name, admissionNo: s.admissionNo, classId: s.classId,
      subjectsCounted: subjectAvgs.length,
      mean: mean(subjectAvgs.map((a) => a[1])),
      points: mean(subjectAvgs.map((a) => gradeFor(a[1]).points)),
      subjectAvgs,
    };
  });

  const subjectMeans = (group: typeof students) => {
    const by = new Map<number, number[]>();
    for (const st of group) for (const [sid, a] of st.subjectAvgs) by.set(sid, [...(by.get(sid) ?? []), a]);
    return [...by].map(([sid, v]) => ({ name: subjectNames.get(sid)!, mean: r1(mean(v)) })).sort((a, b) => b.mean - a.mean);
  };

  const forms = new Map<string, typeof students>();
  for (const st of students) {
    const form = classById.get(st.classId)!.name;
    forms.set(form, [...(forms.get(form) ?? []), st]);
  }

  return [...forms]
    .map(([name, group]) => {
      const maxSubjects = Math.max(...group.map((s) => s.subjectsCounted));

      const byClass = new Map<number, typeof students>();
      for (const st of group) byClass.set(st.classId, [...(byClass.get(st.classId) ?? []), st]);
      const classRows = withPositions(
        [...byClass].map(([classId, g]) => {
          const subs = subjectMeans(g);
          return {
            id: classId, label: classLabel(classById.get(classId)!), students: g.length,
            mean: r1(mean(g.map((s) => s.mean))), grade: gradeFromPoints(mean(g.map((s) => s.points))),
            best: subs[0] ?? null, weakest: subs.length > 1 ? subs[subs.length - 1] : null,
          };
        }).sort((a, b) => b.mean - a.mean),
      );

      const ranking = withPositions(
        [...group].sort((a, b) => b.mean - a.mean).map((s) => ({
          id: s.id, name: s.name, admissionNo: s.admissionNo,
          className: classLabel(classById.get(s.classId)!),
          subjectsCounted: s.subjectsCounted,
          incomplete: s.subjectsCounted < maxSubjects, // fewer subjects marked than classmates, so the mean isn't like for like
          mean: r1(s.mean), grade: gradeFromPoints(s.points),
        })),
      );

      return {
        name, students: group.length,
        mean: r1(mean(group.map((s) => s.mean))), grade: gradeFromPoints(mean(group.map((s) => s.points))),
        classes: classRows, subjects: subjectMeans(group), ranking,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}
