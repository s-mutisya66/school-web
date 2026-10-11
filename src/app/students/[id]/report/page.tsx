"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Report = {
  student: { name: string; admissionNo: string; className: string };
  exams: { id: number; name: string; outOf: number }[];
  subjects: { name: string; scores: { examId: number; outOf: number; score: number | null }[]; average: number; grade: string; points: number; classAverage: number }[];
  summary: { meanPercent: number; meanGrade: string; position: number; classSize: number } | null;
};

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

  const s = report.summary;
  return (
    <main className="min-h-screen bg-stone-50 text-slate-900 print:bg-white">
      <div className="mx-auto max-w-3xl px-5 py-10">
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
        <p className="text-slate-600">{report.student.className} · Admission {report.student.admissionNo} · {terms.find((t) => t.id === termId)?.label}</p>

        {!s ? (
          <p className="mt-8 rounded-md bg-white p-4 text-slate-600 print:border">No marks have been entered for this term yet.</p>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              {[["Mean grade", s.meanGrade], ["Mean score", `${s.meanPercent}%`], ["Class position", `${s.position} of ${s.classSize}`]].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-slate-200 bg-white py-3">
                  <p className="text-2xl font-semibold">{v}</p>
                  <p className="text-sm text-slate-600">{k}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-slate-300 text-sm text-slate-600">
                  <tr>
                    <th className="py-2 pr-3">Subject</th>
                    {report.exams.map((e) => <th key={e.id} className="pr-3 text-right">{e.name}</th>)}
                    <th className="pr-3 text-right">Average</th><th className="pr-3">Grade</th><th className="text-right">Class avg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {report.subjects.map((r) => (
                    <tr key={r.name}>
                      <td className="py-2.5 pr-3 font-medium">{r.name}</td>
                      {r.scores.map((x) => <td key={x.examId} className="pr-3 text-right">{x.score === null ? "–" : `${x.score}/${x.outOf}`}</td>)}
                      <td className="pr-3 text-right">{r.average}%</td>
                      <td className="pr-3 font-semibold">{r.grade}</td>
                      <td className="text-right text-slate-600">{r.classAverage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-slate-500">Grades follow the KCSE scale (A 80–100, B+ 70–74, C 50–54, and so on). Position is by mean score across subjects, and ties share a position.</p>
          </>
        )}
      </div>
    </main>
  );
}
