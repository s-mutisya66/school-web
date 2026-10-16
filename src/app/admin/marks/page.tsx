"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Opt = { id: number; label: string };
type Row = { id: number; admissionNo: string; firstName: string; lastName: string; score: number | null };

const field = "mt-1 block rounded-md border border-slate-300 bg-white px-3 py-2";

export default function Marks() {
  const router = useRouter();
  const [terms, setTerms] = useState<Opt[]>([]);
  const [exams, setExams] = useState<(Opt & { outOf: number })[]>([]);
  const [subjects, setSubjects] = useState<Opt[]>([]);
  const [classes, setClasses] = useState<Opt[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [termId, setTermId] = useState("");
  const [examId, setExamId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [classId, setClassId] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [scores, setScores] = useState<Record<number, string>>({});
  const [outOf, setOutOf] = useState(100);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [newExam, setNewExam] = useState({ name: "", outOf: "100" });
  const [newSubject, setNewSubject] = useState("");

  async function api(url: string, method = "GET", body?: unknown) {
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    if (res.status === 401) { router.push("/login"); return null; }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setMsg({ ok: false, text: json.error ?? "Something went wrong." }); return null; }
    return json;
  }

  const loadSubjects = useCallback(async () => {
    const s = await api("/api/subjects");
    if (s) setSubjects(s.map((x: { id: number; name: string }) => ({ id: x.id, label: x.name })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      const [t, c] = await Promise.all([api("/api/terms"), api("/api/classes")]);
      if (t) { setTerms(t); setTermId(String((t.find((x: { isCurrent: boolean }) => x.isCurrent) ?? t[0])?.id ?? "")); }
      if (c) setClasses(c.map((x: { id: number; name: string; stream: string | null }) => ({ id: x.id, label: x.stream ? `${x.name} ${x.stream}` : x.name })));
      loadSubjects();
      setLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadExams = useCallback(async () => {
    if (!termId) return;
    const e = await api(`/api/exams?termId=${termId}`);
    if (e) { setExams(e.map((x: { id: number; name: string; outOf: number }) => ({ id: x.id, label: x.name, outOf: x.outOf }))); setExamId(""); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termId]);
  useEffect(() => { loadExams(); }, [loadExams]);

  // Only offer the subjects this person may enter marks for in the chosen class.
  useEffect(() => {
    if (!classId) return;
    (async () => {
      const s = await api(`/api/classes/${classId}/subjects`);
      if (s) { setSubjects(s.map((x: { id: number; name: string }) => ({ id: x.id, label: x.name }))); setSubjectId(""); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  useEffect(() => {
    if (!classId || !examId || !subjectId) return setRows([]);
    (async () => {
      const r = await api(`/api/classes/${classId}/marks?examId=${examId}&subjectId=${subjectId}`);
      if (!r) return;
      setMsg(null); setOutOf(r.outOf); setRows(r.rows);
      setScores(Object.fromEntries(r.rows.map((x: Row) => [x.id, x.score === null ? "" : String(x.score)])));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, examId, subjectId]);

  async function save() {
    const records = rows.filter((r) => scores[r.id] !== "").map((r) => ({ studentId: r.id, score: Number(scores[r.id]) }));
    const r = await api(`/api/classes/${classId}/marks`, "PUT", { examId: Number(examId), subjectId: Number(subjectId), records });
    if (r) setMsg({ ok: true, text: `Saved ${r.saved} marks.` });
  }

  async function addExam(e: React.FormEvent) {
    e.preventDefault();
    if (await api("/api/exams", "POST", { termId: Number(termId), name: newExam.name, outOf: Number(newExam.outOf) })) { setNewExam({ name: "", outOf: "100" }); loadExams(); }
  }
  async function addSubject(e: React.FormEvent) {
    e.preventDefault();
    if (await api("/api/subjects", "POST", { name: newSubject })) { setNewSubject(""); loadSubjects(); }
  }

  const Select = ({ label, value, set, opts }: { label: string; value: string; set: (v: string) => void; opts: Opt[] }) => (
    <label className="text-sm font-medium">{label}
      <select value={value} onChange={(e) => set(e.target.value)} className={field}>
        <option value="">Choose…</option>
        {opts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
    </label>
  );

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="text-3xl font-bold">Marks</h1>

      <details className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer font-medium">Set up exams and subjects (admin)</summary>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <form onSubmit={addExam}>
            <p className="text-sm text-slate-600">New exam in the selected term</p>
            <input required placeholder="Mid-term" value={newExam.name} onChange={(e) => setNewExam({ ...newExam, name: e.target.value })} className={`${field} w-full`} />
            <label className="mt-2 block text-sm">Out of <input value={newExam.outOf} onChange={(e) => setNewExam({ ...newExam, outOf: e.target.value })} inputMode="numeric" className="w-20 rounded-md border border-slate-300 px-2 py-1" /></label>
            <button className="mt-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Add exam</button>
          </form>
          <form onSubmit={addSubject}>
            <p className="text-sm text-slate-600">New subject</p>
            <input required placeholder="Mathematics" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} className={`${field} w-full`} />
            <button className="mt-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Add subject</button>
          </form>
        </div>
      </details>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Select label="Term" value={termId} set={setTermId} opts={terms} />
        <Select label="Exam" value={examId} set={setExamId} opts={exams} />
        <Select label="Class" value={classId} set={setClassId} opts={classes} />
        <Select label="Subject" value={subjectId} set={setSubjectId} opts={subjects} />
      </div>
      {termId && exams.length === 0 && <p className="mt-3 text-sm text-slate-600">This term has no exams yet. An admin can add one above.</p>}

      {loaded && classes.length === 0 && (
        <p className="mt-4 rounded-md bg-amber-100 px-4 py-3 text-amber-900">No classes available. If you're a teacher, ask an admin to assign you to your class.</p>
      )}

      {msg && <p role="status" className={`mt-4 rounded-md px-4 py-3 ${msg.ok ? "bg-emerald-100 text-emerald-900" : "bg-rose-100 text-rose-900"}`}>{msg.text}</p>}

      {rows.length > 0 && (
        <>
          <ul className="mt-5 divide-y divide-slate-200 border-y border-slate-200">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                <span>{r.firstName} {r.lastName} <span className="text-sm text-slate-500">{r.admissionNo}</span></span>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input aria-label={`Score for ${r.firstName} ${r.lastName}`} inputMode="numeric" value={scores[r.id] ?? ""}
                         onChange={(e) => setScores({ ...scores, [r.id]: e.target.value.replace(/\D/g, "") })}
                         className="w-20 rounded-md border border-slate-300 px-2 py-1.5 text-right text-base text-slate-900" />
                  / {outOf}
                </label>
              </li>
            ))}
          </ul>
          <button onClick={save} className="mt-5 rounded-md bg-slate-900 px-5 py-2.5 font-semibold text-white">Save marks</button>
        </>
      )}
    </main>
  );
}
