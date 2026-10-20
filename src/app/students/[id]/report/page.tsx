"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type ExamResult = {
  id: number; name: string; outOf: number; mean: number | null; grade: string | null;
  classPosition: number | null; classSize: number; formPosition: number | null; formSize: number;
  classMean: number | null; formMean: number | null;
};
type Report = {
  student: { name: string; admissionNo: string; form: string; className: string };
  exams: ExamResult[];
  subjects: { name: string; scores: { examId: number; score: number | null; outOf: number; grade: string | null }[] }[];
  gradeScale: string;
};

const th = "py-2 pr-4 text-sm font-medium text-slate-600";

export default function ReportCard() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [terms, setTerms] = useState<{ id: number; label: string }[]>([]);
  const [termId, setTermId] = useState<number | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (t?: number) => {
    const res = await fetch(`/api/students/${id}/report${t ? `?termId=${t}` : ""}`);
    if (res.status === 401) return router.push("/login");
    if (res.status === 403) return setError("You don't have access to this student's report card.");
    const json = await res.json();
    setTerms(json.terms); setTermId(json.termId ?? null); setReport(json.report);
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  if (error) return <main className="p-8 text-slate-700">{error}</main>;
  if (!report) return <main className="p-8 text-slate-600">Loading report card…</main>;

  const sat = report.exams.filter((e) => e.mean !== null);

  return (
    <main className="min-h-screen bg-stone-50 text-slate-900 print:bg-white">
      <div className="mx-auto max-w-4xl px-5 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <select aria-label="Term" value={termId ?? ""} onChange={(e) => load(Number(e.target.value))} className="rounded-md border border-slate-300 bg-white px-3 py-2">
            {terms.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <div className="space-x-4 text-sm">
            <a href={`/students/${id}/fees`} className="underline">Fees</a>
            <button onClick={() => window.print()} className="underline">Print</button>
          </div>
        </div>

        <h1 className="mt-6 text-4xl font-bold tracking-tight">{report.student.name}</h1>
        <p className="text-slate-600">{report.student.className}, admission {report.student.admissionNo}, {terms.find((t) => t.id === termId)?.label}</p>

        {sat.length === 0 ? (
          <p className="mt-8 rounded-md bg-white p-4 text-slate-600 print:border">No marks have been entered for this term yet.</p>
        ) : (
          <>
            <h2 className="mt-8 text-2xl font-semibold">Position in each exam</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-slate-300">
                  <tr>
                    <th className={th}>Exam</th><th className={th}>Average</th><th className={th}>Grade</th>
                    <th className={th}>Position in {report.student.className}</th>
                    <th className={th}>Overall position in {report.student.form}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {report.exams.map((e) => (
                    <tr key={e.id}>
                      <td className="py-3 pr-4 font-medium">{e.name}</td>
                      {e.mean === null ? (
                        <td className="pr-4 text-slate-500" colSpan={4}>No marks yet</td>
                      ) : (
                        <>
                          <td className="pr-4">{e.mean}%</td>
                          <td className="pr-4 font-semibold">{e.grade}</td>
                          <td className="pr-4"><span className="font-semibold">{e.classPosition}</span> of {e.classSize}</td>
                          <td className="pr-4"><span className="font-semibold">{e.formPosition}</span> of {e.formSize}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Overall position compares {report.student.form} across all its streams. The class mean and {report.student.form} mean in each exam were{" "}
              {sat.map((e) => `${e.name} ${e.classMean}% and ${e.formMean}%`).join("; ")}.
            </p>

            <h2 className="mt-10 text-2xl font-semibold">Scores by subject</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-slate-300">
                  <tr><th className={th}>Subject</th>{report.exams.map((e) => <th key={e.id} className={`${th} text-right`}>{e.name}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {report.subjects.map((s) => (
                    <tr key={s.name}>
                      <td className="py-2.5 pr-4 font-medium">{s.name}</td>
                      {s.scores.map((x) => (
                        <td key={x.examId} className="pr-4 text-right">
                          {x.score === null ? "–" : <>{x.score}/{x.outOf} <span className="ml-1 font-semibold">{x.grade}</span></>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-slate-500">Each exam is shown on its own and exams are not averaged together. Grades: {report.gradeScale}. Ties share a position.</p>
          </>
        )}
      </div>
    </main>
  );
}
