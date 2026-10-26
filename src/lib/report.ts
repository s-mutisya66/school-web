import { db } from "./db";
import { gradeFor, GRADE_SCALE } from "./grading";
import { sortExams } from "./exams";

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const r1 = (n: number) => Math.round(n * 10) / 10;

/**
 * A student's report for one term. Each exam stands on its own: its own scores, average, grade, position in
 * class and overall position in the form (all streams together). Exams are never averaged together.
 */
export async function buildReport(studentId: number, termId: number) {
  const student = await db.student.findUniqueOrThrow({ where: { id: studentId }, include: { schoolClass: true } });
  const exams = sortExams(await db.exam.findMany({ where: { termId } }));
  const form = student.schoolClass.name;
  const term = await db.term.findUnique({ where: { id: termId } });
  const nextTerm = term ? await db.term.findFirst({ where: { startsOn: { gt: term.startsOn } }, orderBy: { startsOn: "asc" } }) : null;

  // Marks for the whole form, so positions can be worked out against every stream.
  const marks = await db.mark.findMany({
    where: { exam: { termId }, student: { schoolClass: { name: form }, OR: [{ status: "active" }, { id: studentId }] } },
    select: {
      examId: true, score: true,
      exam: { select: { outOf: true } },
      subject: { select: { id: true, name: true } },
      student: { select: { id: true, schoolClassId: true } },
    },
  });

  const subjectNames = new Map<number, string>();
  const classOf = new Map<number, number>();
  const pct = new Map<number, Map<number, Map<number, number>>>(); // exam -> student -> subject -> %
  const mine = new Map<string, number>(); // `${exam}:${subject}` -> raw score
  for (const m of marks) {
    subjectNames.set(m.subject.id, m.subject.name);
    classOf.set(m.student.id, m.student.schoolClassId);
    const ex = pct.get(m.examId) ?? new Map<number, Map<number, number>>();
    const st = ex.get(m.student.id) ?? new Map<number, number>();
    st.set(m.subject.id, (m.score / m.exam.outOf) * 100);
    ex.set(m.student.id, st);
    pct.set(m.examId, ex);
    if (m.student.id === studentId) mine.set(`${m.examId}:${m.subject.id}`, m.score);
  }

  const perExam = exams.map((e) => {
    const means = [...(pct.get(e.id) ?? [])].map(([sid, subj]) => ({ sid, classId: classOf.get(sid)!, mean: r1(mean([...subj.values()])) }));
    const me = means.find((x) => x.sid === studentId);
    if (!me) {
      return { id: e.id, name: e.name, outOf: e.outOf, total: null, totalOutOf: 0, mean: null, grade: null, classPosition: null, classSize: 0, formPosition: null, formSize: 0, classMean: null, formMean: null };
    }
    const inClass = means.filter((x) => x.classId === student.schoolClassId);
    const position = (list: typeof means) => 1 + list.filter((x) => x.mean > me.mean).length; // ties share a position
    const myMarks = [...mine].filter(([k]) => k.startsWith(`${e.id}:`)).map(([, v]) => v);
    return {
      id: e.id, name: e.name, outOf: e.outOf,
      total: myMarks.reduce((a, b) => a + b, 0), totalOutOf: myMarks.length * e.outOf,
      mean: me.mean, grade: gradeFor(me.mean),
      classPosition: position(inClass), classSize: inClass.length,
      formPosition: position(means), formSize: means.length,
      classMean: r1(mean(inClass.map((x) => x.mean))), formMean: r1(mean(means.map((x) => x.mean))),
    };
  });

  const subjectIds = [...new Set([...pct.values()].flatMap((ex) => [...(ex.get(studentId)?.keys() ?? [])]))];
  const subjects = subjectIds
    .map((sid) => ({
      name: subjectNames.get(sid)!,
      scores: exams.map((e) => {
        const p = pct.get(e.id)?.get(studentId)?.get(sid);
        return { examId: e.id, score: mine.get(`${e.id}:${sid}`) ?? null, outOf: e.outOf, grade: p === undefined ? null : gradeFor(r1(p)) };
      }),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    student: {
      id: student.id, name: `${student.firstName} ${student.lastName}`, admissionNo: student.admissionNo,
      gender: student.gender === "MALE" ? "Male" : student.gender === "FEMALE" ? "Female" : "",
      form, className: student.schoolClass.stream ? `${form} ${student.schoolClass.stream}` : form,
    },
    term: term
      ? {
          label: `Term ${term.termNumber}, ${term.academicYear}`, year: term.academicYear,
          closes: term.endsOn.toISOString(), nextOpens: nextTerm ? nextTerm.startsOn.toISOString() : null,
        }
      : null,
    exams: perExam,
    subjects,
    gradeScale: GRADE_SCALE,
  };
}