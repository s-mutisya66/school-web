export type ExamResult = {
  id: number; name: string; outOf: number; total: number | null; totalOutOf: number;
  mean: number | null; grade: string | null;
  classPosition: number | null; classSize: number; formPosition: number | null; formSize: number;
  classMean: number | null; formMean: number | null;
};
export type Report = {
  student: { name: string; admissionNo: string; form: string; className: string };
  exams: ExamResult[];
  subjects: { name: string; scores: { examId: number; score: number | null; outOf: number; grade: string | null }[] }[];
  gradeScale: string;
};

const head = "px-3 py-3 text-right text-sm font-semibold text-slate-700";
const cell = "px-3 py-2.5 text-right tabular-nums";

/** The record sheet: one column per exam, a row per subject, then total and average, class position and overall position. */
export function ReportSheet({ report, termLabel }: { report: Report; termLabel: string }) {
  const { student, exams, subjects } = report;
  const sat = exams.filter((e) => e.mean !== null);

  return (
    <article className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm print:rounded-none print:border-slate-500 print:shadow-none">
      <header className="bg-[#2A0800] px-6 py-5 text-white print:border-b-2 print:border-slate-900 print:bg-white print:text-slate-900">
        <h1 className="text-3xl font-bold tracking-tight">{student.name}</h1>
        <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-1 text-sm">
          <div className="flex gap-2"><dt className="text-slate-300 print:text-slate-600">Class</dt><dd className="font-medium">{student.className}</dd></div>
          <div className="flex gap-2"><dt className="text-slate-300 print:text-slate-600">Admission no</dt><dd className="font-medium">{student.admissionNo}</dd></div>
          <div className="flex gap-2"><dt className="text-slate-300 print:text-slate-600">Term</dt><dd className="font-medium">{termLabel}</dd></div>
        </dl>
      </header>

      {sat.length === 0 ? (
        <p className="p-6 text-slate-600">No marks have been entered for this term yet.</p>
      ) : (
        <div className="overflow-x-auto p-4 sm:p-6">
          <table className="w-full min-w-[32rem] border-collapse text-left">
            <thead>
              <tr className="border-b-2 border-slate-800">
                <th scope="col" className="px-3 py-3 text-sm font-semibold text-slate-700">Subject</th>
                {exams.map((e) => (
                  <th key={e.id} scope="col" className={head}>
                    {e.name}
                    <span className="block text-xs font-normal text-slate-500">out of {e.outOf}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subjects.map((s, i) => (
                <tr key={s.name} className={`border-b border-slate-200 ${i % 2 ? "bg-slate-50 print:bg-white" : ""}`}>
                  <th scope="row" className="px-3 py-2.5 font-medium">{s.name}</th>
                  {s.scores.map((x) => (
                    <td key={x.examId} className={cell}>
                      {x.score === null ? <span className="text-slate-400">–</span> : <>{x.score}<span className="ml-2 inline-block w-8 text-left text-sm font-semibold text-slate-600">{x.grade}</span></>}
                    </td>
                  ))}
                </tr>
              ))}

              {/* The three summary rows */}
              <tr className="border-t-2 border-slate-800 bg-slate-100 print:bg-white">
                <th scope="row" className="px-3 py-3 font-bold">Total marks and average</th>
                {exams.map((e) => (
                  <td key={e.id} className={`${cell} leading-snug`}>
                    {e.mean === null ? <span className="text-slate-400">–</span> : (
                      <>
                        <span className="block font-bold">{e.total} <span className="font-normal text-slate-500">/ {e.totalOutOf}</span></span>
                        <span className="block">{e.mean}% <span className="ml-1 font-bold">{e.grade}</span></span>
                      </>
                    )}
                  </td>
                ))}
              </tr>
              <tr className="border-t border-slate-300 bg-slate-50 print:bg-white">
                <th scope="row" className="px-3 py-3 font-bold">
                  Class position <span className="block text-xs font-normal text-slate-500">{student.className}</span>
                </th>
                {exams.map((e) => (
                  <td key={e.id} className={cell}>
                    {e.classPosition === null ? <span className="text-slate-400">–</span> : <><span className="text-lg font-bold">{e.classPosition}</span> <span className="text-slate-500">of {e.classSize}</span></>}
                  </td>
                ))}
              </tr>
              <tr className="border-t border-slate-300 border-b-2 border-b-slate-800 bg-slate-50 print:bg-white">
                <th scope="row" className="px-3 py-3 font-bold">
                  Overall position <span className="block text-xs font-normal text-slate-500">{student.form}</span>
                </th>
                {exams.map((e) => (
                  <td key={e.id} className={cell}>
                    {e.formPosition === null ? <span className="text-slate-400">–</span> : <><span className="text-lg font-bold">{e.formPosition}</span> <span className="text-slate-500">of {e.formSize}</span></>}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>

          <p className="mt-4 text-sm text-slate-500">
            Class average and {student.form} average: {sat.map((e) => `${e.name} ${e.classMean}% and ${e.formMean}%`).join("; ")}.
          </p>
          <p className="mt-1 text-sm text-slate-500">Grades: {report.gradeScale}.</p>
        </div>
      )}
    </article>
  );
}
