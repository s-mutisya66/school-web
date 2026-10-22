import { db } from "./db";
import { gradeFor } from "./grading";
import { sortExams } from "./exams";
import { classLabel } from "./student-csv";
import { rankRows, type SheetRow } from "./sheet";

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const r1 = (n: number) => Math.round(n * 10) / 10;
const sex = (g: "MALE" | "FEMALE" | null) => (g === "MALE" ? "M" : g === "FEMALE" ? "F" : "");

export async function buildPerformance(termId: number, wantedExamId?: number) {
  const exams = sortExams(await db.exam.findMany({ where: { termId }, select: { id: true, name: true, outOf: true } }));
  if (exams.length === 0) return { exams: [], examId: null as number | null, forms: [] };

  const [marks, classes] = await Promise.all([
    db.mark.findMany({
      where: { exam: { termId }, student: { status: "active" } },
      select: {
        examId: true, score: true,
        exam: { select: { outOf: true } },
        subject: { select: { id: true, name: true } },
        student: { select: { id: true, firstName: true, lastName: true, admissionNo: true, gender: true, schoolClassId: true } },
      },
    }),
    db.schoolClass.findMany(),
  ]);
  const classById = new Map(classes.map((c) => [c.id, c]));
  const formOf = (classId: number) => classById.get(classId)!.name;

  type Stu = { id: number; name: string; gender: string; admissionNo: string; classId: number; pct: Map<number, number>; marks: Map<number, number>; raw: number };
  const byExam = new Map<number, Map<number, Stu>>();
  const subjectNames = new Map<number, string>();
  for (const m of marks) {
    subjectNames.set(m.subject.id, m.subject.name);
    const inExam = byExam.get(m.examId) ?? new Map<number, Stu>();
    const s = inExam.get(m.student.id) ?? {
      id: m.student.id, name: `${m.student.firstName} ${m.student.lastName}`, gender: sex(m.student.gender),
      admissionNo: m.student.admissionNo, classId: m.student.schoolClassId, pct: new Map<number, number>(), marks: new Map<number, number>(), raw: 0,
    };
    s.pct.set(m.subject.id, (m.score / m.exam.outOf) * 100);
    s.marks.set(m.subject.id, m.score);
    s.raw += m.score;
    inExam.set(s.id, s);
    byExam.set(m.examId, inExam);
  }

  const studentsOf = (examId: number) =>
    [...(byExam.get(examId)?.values() ?? [])].map((s) => ({ ...s, subjectsCounted: s.pct.size, mean: r1(mean([...s.pct.values()])) }));
  const examStudents = new Map(exams.map((e) => [e.id, studentsOf(e.id)]));
  const hasMarks = (id: number) => (examStudents.get(id)?.length ?? 0) > 0;
  const selected = exams.find((e) => e.id === wantedExamId) ?? [...exams].reverse().find((e) => hasMarks(e.id)) ?? exams[0];

  const formNames = [...new Set([...examStudents.values()].flat().map((s) => formOf(s.classId)))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const forms = formNames.map((form) => {
    const inForm = <T extends { classId: number }>(s: T) => formOf(s.classId) === form;
    const formClasses = classes.filter((c) => c.name === form).sort((a, b) => (a.stream ?? "").localeCompare(b.stream ?? ""));

    // How the form and each stream did in every exam, for the progress chart.
    const trend = exams.map((e) => {
      const sts = examStudents.get(e.id)!.filter(inForm);
      return {
        examId: e.id, name: e.name,
        mean: sts.length ? r1(mean(sts.map((s) => s.mean))) : null,
        classes: formClasses.map((c) => {
          const cs = sts.filter((s) => s.classId === c.id);
          return { label: classLabel(c), mean: cs.length ? r1(mean(cs.map((s) => s.mean))) : null };
        }),
      };
    });

    // The full picture for the selected exam.
    const group = examStudents.get(selected.id)!.filter(inForm);
    let detail = null;
    if (group.length) {
      const columnIds = [...new Set(group.flatMap((s) => [...s.pct.keys()]))].sort((a, b) => subjectNames.get(a)!.localeCompare(subjectNames.get(b)!));
      const maxSubjects = Math.max(...group.map((s) => s.subjectsCounted));
      const subjectMean = (g: typeof group, id: number) => {
        const v = g.filter((s) => s.pct.has(id)).map((s) => s.pct.get(id)!);
        return v.length ? mean(v) : null;
      };

      const rows: SheetRow[] = rankRows(
        group.map((s) => ({
          id: s.id, name: s.name, gender: s.gender, admissionNo: s.admissionNo, className: classLabel(classById.get(s.classId)!),
          scores: columnIds.map((id) => s.marks.get(id) ?? null), // marks as entered, out of the exam total
          // Fewer subjects marked than classmates, so the average isn't like for like.
          incomplete: s.subjectsCounted < maxSubjects, total: s.raw,
          mean: s.mean, grade: gradeFor(s.mean),
        })),
      );

      const classRanking = rankRows(
        formClasses.flatMap((c) => {
          const cs = group.filter((s) => s.classId === c.id);
          if (!cs.length) return [];
          const subs = columnIds.map((id) => ({ name: subjectNames.get(id)!, mean: subjectMean(cs, id) })).filter((x): x is { name: string; mean: number } => x.mean !== null).sort((a, b) => b.mean - a.mean);
          const m = r1(mean(cs.map((s) => s.mean)));
          return [{
            id: c.id, label: classLabel(c), students: cs.length, mean: m, grade: gradeFor(m),
            best: subs[0] ? { name: subs[0].name, mean: r1(subs[0].mean) } : null,
            weakest: subs.length > 1 ? { name: subs[subs.length - 1].name, mean: r1(subs[subs.length - 1].mean) } : null,
          }];
        }),
      );

      const m = r1(mean(group.map((s) => s.mean)));
      detail = {
        students: group.length, outOf: selected.outOf, mean: m, grade: gradeFor(m),
        columns: columnIds.map((id) => ({ id, name: subjectNames.get(id)! })),
        subjectMeans: columnIds.map((id) => ({ name: subjectNames.get(id)!, mean: r1(subjectMean(group, id)!) })).sort((a, b) => b.mean - a.mean),
        classes: classRanking, rows,
      };
    }

    return { name: form, trend, detail };
  });

  return { exams: exams.map((e) => ({ id: e.id, name: e.name, hasMarks: hasMarks(e.id) })), examId: selected.id, forms };
}
