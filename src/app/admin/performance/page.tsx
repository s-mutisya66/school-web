"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Sub = { name: string; mean: number };
type Form = {
  name: string; students: number; mean: number; grade: string;
  classes: { id: number; label: string; students: number; mean: number; grade: string; position: number; best: Sub | null; weakest: Sub | null }[];
  subjects: Sub[];
  ranking: { id: number; name: string; admissionNo: string; className: string; subjectsCounted: number; incomplete: boolean; mean: number; grade: string; position: number }[];
};
type Data = { periods: { value: string; label: string }[]; selected: string | null; forms: Form[] };

const th = "py-2 pr-4 text-sm font-medium text-slate-600";

export default function Performance() {
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const [period, setPeriod] = useState("");
  const [active, setActive] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (p: string) => {
    const res = await fetch(`/api/performance${p ? `?period=${encodeURIComponent(p)}` : ""}`);
    if (res.status === 401) return router.push("/login");
    if (res.status === 403) return setError("Only administrators can see school performance.");
    const json: Data = await res.json();
    setData(json);
    setPeriod(json.selected ?? "");
    setActive((cur) => (json.forms.some((f) => f.name === cur) ? cur : json.forms[0]?.name ?? ""));
    setShowAll(false);
  }, [router]);

  useEffect(() => { load(""); }, [load]);

  if (error) return <main className="p-8 text-slate-700">{error}</main>;
  if (!data) return <main className="p-8 text-slate-600">Loading performance…</main>;

  const form = data.forms.find((f) => f.name === active);
  const shown = form ? (showAll ? form.ranking : form.ranking.slice(0, 10)) : [];

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-bold">Performance</h1>
        <label className="text-sm font-medium">Period
          <select value={period} onChange={(e) => load(e.target.value)} className="mt-1 block rounded-md border border-slate-300 bg-white px-3 py-2">
            {data.periods.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </label>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        Each student's score is the mean of their subject averages. A subject's average is the mean of its exam percentages in the period.
        Ties share a position. Only students with marks entered are ranked.
      </p>

      {data.forms.length === 0 ? (
        <p className="mt-8 rounded-md bg-white p-4 text-slate-600">No marks have been entered for this period yet.</p>
      ) : (
        <>
          <div role="tablist" className="mt-6 flex flex-wrap gap-2 border-b border-slate-300">
            {data.forms.map((f) => (
              <button key={f.name} role="tab" aria-selected={f.name === active} onClick={() => { setActive(f.name); setShowAll(false); }}
                      className={`-mb-px border-b-2 px-4 py-2 font-medium ${f.name === active ? "border-slate-900" : "border-transparent text-slate-600 hover:text-slate-900"}`}>
                {f.name}
              </button>
            ))}
          </div>

          {form && (
            <div className="mt-6 space-y-10">
              <div className="grid grid-cols-3 gap-3 text-center">
                {[["Students ranked", String(form.students)], ["Mean score", `${form.mean}%`], ["Mean grade", form.grade]].map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-slate-200 bg-white py-3">
                    <p className="text-2xl font-semibold">{v}</p>
                    <p className="text-sm text-slate-600">{k}</p>
                  </div>
                ))}
              </div>

              <section>
                <h2 className="text-xl font-semibold">{form.name} classes, ranked</h2>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b border-slate-300"><tr>
                      <th className={th}>Rank</th><th className={th}>Class</th><th className={th}>Students</th><th className={th}>Mean</th><th className={th}>Grade</th><th className={th}>Strongest subject</th><th className={th}>Weakest subject</th>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-200">
                      {form.classes.map((c) => (
                        <tr key={c.id}>
                          <td className="py-2.5 pr-4 font-semibold">{c.position}</td><td className="pr-4">{c.label}</td><td className="pr-4">{c.students}</td>
                          <td className="pr-4">{c.mean}%</td><td className="pr-4">{c.grade}</td>
                          <td className="pr-4">{c.best ? `${c.best.name} (${c.best.mean}%)` : "–"}</td>
                          <td className="pr-4">{c.weakest ? `${c.weakest.name} (${c.weakest.mean}%)` : "–"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold">{form.name} subject averages</h2>
                <ul className="mt-3 space-y-2">
                  {form.subjects.map((s) => (
                    <li key={s.name} className="grid grid-cols-[9rem_1fr_3.5rem] items-center gap-3 text-sm">
                      <span>{s.name}</span>
                      <span className="h-2.5 overflow-hidden rounded-full bg-slate-200"><span className="block h-full bg-emerald-700" style={{ width: `${Math.min(s.mean, 100)}%` }} /></span>
                      <span className="text-right">{s.mean}%</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold">{form.name} student ranking, all streams</h2>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b border-slate-300"><tr>
                      <th className={th}>Position</th><th className={th}>Student</th><th className={th}>Adm. no.</th><th className={th}>Class</th><th className={th}>Mean</th><th className={th}>Grade</th>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-200">
                      {shown.map((r) => (
                        <tr key={r.id}>
                          <td className="py-2.5 pr-4 font-semibold">{r.position}</td>
                          <td className="pr-4">{r.name}{r.incomplete && <span title={`Only ${r.subjectsCounted} subjects marked, fewer than classmates`} className="ml-1 text-amber-700">*</span>}</td>
                          <td className="pr-4">{r.admissionNo}</td><td className="pr-4">{r.className}</td><td className="pr-4">{r.mean}%</td><td className="pr-4">{r.grade}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {form.ranking.some((r) => r.incomplete) && <p className="mt-2 text-sm text-amber-800">* Fewer subjects have marks for this student than for their classmates, so the mean isn't like for like.</p>}
                {form.ranking.length > 10 && (
                  <button onClick={() => setShowAll(!showAll)} className="mt-3 text-sm underline">{showAll ? "Show top 10 only" : `Show all ${form.ranking.length} students`}</button>
                )}
              </section>
            </div>
          )}
        </>
      )}
    </main>
  );
}
