"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ProgressChart } from "@/components/progress-chart";
import { bestBySubject, fmt, nameWithSex, rankRows, type SheetRow } from "@/lib/sheet";
import { GRADE_SCALE } from "@/lib/grading";

type Detail = {
  students: number; mean: number; grade: string;
  columns: { id: number; name: string }[];
  subjectMeans: { name: string; mean: number }[];
  classes: { id: number; label: string; students: number; mean: number; grade: string; position: number; best: { name: string; mean: number } | null; weakest: { name: string; mean: number } | null }[];
  rows: SheetRow[];
};
type Form = { name: string; trend: { examId: number; name: string; mean: number | null; classes: { label: string; mean: number | null }[] }[]; detail: Detail | null };
type Data = { terms: { id: number; label: string }[]; termId: number | null; exams: { id: number; name: string; hasMarks: boolean }[]; examId: number | null; forms: Form[] };

const th = "py-2 pr-3 text-sm font-medium text-slate-600";

export default function Performance() {
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const [active, setActive] = useState("");
  const [stream, setStream] = useState("all");
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  const load = useCallback(async (termId?: number, examId?: number) => {
    const q = new URLSearchParams();
    if (termId) q.set("termId", String(termId));
    if (examId) q.set("examId", String(examId));
    const res = await fetch(`/api/performance?${q}`);
    if (res.status === 401) return router.push("/login");
    if (res.status === 403) return setError("Only administrators can see school performance.");
    const json: Data = await res.json();
    setData(json);
    setActive((cur) => (json.forms.some((f) => f.name === cur) ? cur : json.forms[0]?.name ?? ""));
    setStream("all");
    setShowAll(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const form = data?.forms.find((f) => f.name === active);
  const detail = form?.detail ?? null;
  const exam = data?.exams.find((e) => e.id === data.examId);
  const termLabel = data?.terms.find((t) => t.id === data.termId)?.label ?? "";

  // The sheet can show the whole form or one stream; positions are worked out for whatever is shown.
  const rows = useMemo(() => {
    if (!detail) return [];
    const picked = stream === "all" ? detail.rows : detail.rows.filter((r) => r.className === stream);
    return rankRows(picked) as SheetRow[];
  }, [detail, stream]);
  const best = useMemo(() => (detail ? bestBySubject(rows, detail.columns, 3) : []), [detail, rows]);

  async function downloadPdf() {
    if (!detail || !form || !exam) return;
    setPdfBusy(true);
    const { buildSheetPdf } = await import("@/lib/performance-pdf");
    const scope = stream === "all" ? `${form.name}, all streams` : stream;
    buildSheetPdf({
      title: `${scope}: ${exam.name}`,
      subtitle: `${termLabel}. Positions are within ${stream === "all" ? "the whole form" : "this class"}. ${rows.length} students.`,
      columns: detail.columns, rows, gradeScale: GRADE_SCALE,
    }).save(`${scope}-${exam.name}-${termLabel}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "") + ".pdf");
    setPdfBusy(false);
  }

  if (error) return <main className="p-8 text-slate-700">{error}</main>;
  if (!data) return <main className="p-8 text-slate-600">Loading performance…</main>;

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-bold">Performance</h1>
        <label className="text-sm font-medium">Term
          <select value={data.termId ?? ""} onChange={(e) => load(Number(e.target.value))} className="mt-1 block rounded-md border border-slate-300 bg-white px-3 py-2">
            {data.terms.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </label>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        Each exam stands on its own. An average is the mean of a student's subject scores in that exam, and the grade comes straight from it ({GRADE_SCALE}). Ties share a position.
      </p>

      {data.exams.length === 0 || data.forms.length === 0 ? (
        <p className="mt-8 rounded-md bg-white p-4 text-slate-600">No marks have been entered for this term yet.</p>
      ) : (
        <>
          <div role="tablist" aria-label="Form" className="mt-6 flex flex-wrap gap-2 border-b border-slate-300">
            {data.forms.map((f) => (
              <button key={f.name} role="tab" aria-selected={f.name === active} onClick={() => { setActive(f.name); setStream("all"); setShowAll(false); }}
                      className={`-mb-px border-b-2 px-4 py-2 font-medium ${f.name === active ? "border-slate-900" : "border-transparent text-slate-600 hover:text-slate-900"}`}>
                {f.name}
              </button>
            ))}
          </div>

          {form && (
            <div className="mt-6 space-y-10">
              <section>
                <h2 className="text-xl font-semibold">{form.name} progress this term</h2>
                <p className="mb-2 text-sm text-slate-600">Mean score in each exam, from the opener to the end-term. The thick line is the whole form, the others are its streams.</p>
                <ProgressChart
                  labels={form.trend.map((t) => t.name)}
                  series={[
                    { name: `${form.name} (all streams)`, values: form.trend.map((t) => t.mean), strong: true },
                    ...(form.trend[0]?.classes ?? []).map((c, i) => ({ name: c.label, values: form.trend.map((t) => t.classes[i].mean) })),
                  ]}
                />
              </section>

              <section>
                <h2 className="sr-only">Choose an exam</h2>
                <div role="tablist" aria-label="Exam" className="inline-flex flex-wrap gap-1 rounded-lg bg-slate-200 p-1">
                  {data.exams.map((e) => (
                    <button key={e.id} role="tab" aria-selected={e.id === data.examId} onClick={() => load(data.termId!, e.id)}
                            className={`rounded-md px-4 py-2 text-sm font-semibold ${e.id === data.examId ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-white"} ${e.hasMarks ? "" : "opacity-60"}`}>
                      {e.name}
                    </button>
                  ))}
                </div>
              </section>

              {!detail ? (
                <p className="rounded-md bg-white p-4 text-slate-600">No marks for {form.name} in {exam?.name} yet.</p>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[["Students ranked", String(detail.students)], ["Mean score", `${detail.mean}%`], ["Mean grade", detail.grade]].map(([k, v]) => (
                      <div key={k} className="rounded-lg border border-slate-200 bg-white py-3">
                        <p className="text-2xl font-semibold">{v}</p>
                        <p className="text-sm text-slate-600">{k}</p>
                      </div>
                    ))}
                  </div>

                  <section>
                    <h2 className="text-xl font-semibold">{form.name} classes, ranked in {exam?.name}</h2>
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="border-b border-slate-300"><tr>
                          <th className={th}>Rank</th><th className={th}>Class</th><th className={th}>Students</th><th className={th}>Mean</th><th className={th}>Grade</th><th className={th}>Strongest subject</th><th className={th}>Weakest subject</th>
                        </tr></thead>
                        <tbody className="divide-y divide-slate-200">
                          {detail.classes.map((c) => (
                            <tr key={c.id}>
                              <td className="py-2.5 pr-3 font-semibold">{c.position}</td><td className="pr-3">{c.label}</td><td className="pr-3">{c.students}</td>
                              <td className="pr-3">{c.mean}%</td><td className="pr-3">{c.grade}</td>
                              <td className="pr-3">{c.best ? `${c.best.name} (${c.best.mean}%)` : "–"}</td>
                              <td className="pr-3">{c.weakest ? `${c.weakest.name} (${c.weakest.mean}%)` : "–"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold">{form.name} subject averages</h2>
                    <ul className="mt-3 space-y-2">
                      {detail.subjectMeans.map((s) => (
                        <li key={s.name} className="grid grid-cols-[9rem_1fr_3.5rem] items-center gap-3 text-sm">
                          <span>{s.name}</span>
                          <span className="h-2.5 overflow-hidden rounded-full bg-slate-200"><span className="block h-full bg-emerald-700" style={{ width: `${Math.min(s.mean, 100)}%` }} /></span>
                          <span className="text-right">{s.mean}%</span>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section>
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <h2 className="text-xl font-semibold">Performance sheet, {exam?.name}</h2>
                      <div className="flex flex-wrap items-end gap-3">
                        <label className="text-sm font-medium">Show
                          <select value={stream} onChange={(e) => { setStream(e.target.value); setShowAll(false); }} className="mt-1 block rounded-md border border-slate-300 bg-white px-3 py-2">
                            <option value="all">{form.name}, all streams</option>
                            {detail.classes.map((c) => <option key={c.id} value={c.label}>{c.label}</option>)}
                          </select>
                        </label>
                        <button onClick={downloadPdf} disabled={pdfBusy || rows.length === 0} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                          {pdfBusy ? "Preparing…" : "Download PDF"}
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">Positions are within {stream === "all" ? "the whole form" : "the chosen class"}.</p>

                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-300"><tr>
                          <th className={th}>Pos</th><th className={th}>Name</th><th className={th}>Adm no</th><th className={th}>Class</th>
                          {detail.columns.map((c) => <th key={c.id} className={`${th} text-right`}>{c.name}</th>)}
                          <th className={`${th} text-right`}>Average</th><th className={th}>Grade</th>
                        </tr></thead>
                        <tbody className="divide-y divide-slate-200">
                          {(showAll ? rows : rows.slice(0, 25)).map((r) => (
                            <tr key={r.id}>
                              <td className="py-2 pr-3 font-semibold">{r.position}</td>
                              <td className="pr-3 whitespace-nowrap">{nameWithSex(r)}{r.incomplete && <span title="Marks for fewer subjects than classmates" className="ml-1 text-amber-700">*</span>}</td>
                              <td className="pr-3">{r.admissionNo}</td><td className="pr-3 whitespace-nowrap">{r.className}</td>
                              {r.scores.map((s, i) => <td key={i} className="pr-3 text-right">{fmt(s)}</td>)}
                              <td className="pr-3 text-right font-semibold">{fmt(r.mean)}%</td><td className="pr-3 font-semibold">{r.grade}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {rows.some((r) => r.incomplete) && <p className="mt-2 text-sm text-amber-800">* Marks entered for fewer subjects than classmates, so the average isn't like for like.</p>}
                    {rows.length > 25 && <button onClick={() => setShowAll(!showAll)} className="mt-3 text-sm underline">{showAll ? "Show the first 25 only" : `Show all ${rows.length} students`}</button>}
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold">Best student in each subject</h2>
                    <p className="text-sm text-slate-600">For {stream === "all" ? `${form.name}, all streams` : stream}, in {exam?.name}. The same list is on the second page of the PDF.</p>
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-300"><tr><th className={th}>Subject</th><th className={th}>1st</th><th className={th}>2nd</th><th className={th}>3rd</th></tr></thead>
                        <tbody className="divide-y divide-slate-200">
                          {best.map((b) => (
                            <tr key={b.subject} className="align-top">
                              <td className="py-2 pr-3 font-semibold">{b.subject}</td>
                              {[1, 2, 3].map((p) => (
                                <td key={p} className="pr-3">
                                  {b.top.filter((t) => t.position === p).map((t) => <div key={t.name}>{t.name}, {t.className}: <span className="font-semibold">{fmt(t.score)}</span></div>)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}
