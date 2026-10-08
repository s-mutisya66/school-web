"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Status = "PRESENT" | "LATE" | "ABSENT" | "EXCUSED";
type Cls = { id: number; name: string; stream: string | null };
type Row = { id: number; admissionNo: string; firstName: string; lastName: string; status: Status | null };

const OPTIONS: { value: Status; label: string; on: string }[] = [
  { value: "PRESENT", label: "Present", on: "bg-emerald-700 text-white border-emerald-700" },
  { value: "LATE", label: "Late", on: "bg-amber-600 text-white border-amber-600" },
  { value: "ABSENT", label: "Absent", on: "bg-rose-700 text-white border-rose-700" },
  { value: "EXCUSED", label: "Excused", on: "bg-slate-700 text-white border-slate-700" },
];

const today = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in the user's local time

export default function Attendance() {
  const router = useRouter();
  const [classes, setClasses] = useState<Cls[]>([]);
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(today());
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/classes").then(async (r) => {
      if (r.status === 401) return router.push("/login");
      if (r.ok) setClasses(await r.json());
    });
  }, [router]);

  const load = useCallback(async () => {
    if (!classId) return setRows([]);
    const r = await fetch(`/api/classes/${classId}/attendance?date=${date}`);
    if (r.status === 401) return router.push("/login");
    if (!r.ok) return setMsg({ ok: false, text: (await r.json()).error ?? "Could not load the class." });
    setMsg(null);
    setRows(await r.json());
  }, [classId, date, router]);

  useEffect(() => { load(); }, [load]);

  const set = (id: number, status: Status) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
  const unmarked = rows.filter((r) => !r.status).length;

  async function save() {
    setSaving(true);
    const records = rows.filter((r) => r.status).map((r) => ({ studentId: r.id, status: r.status }));
    const res = await fetch(`/api/classes/${classId}/attendance`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, records }),
    });
    const json = await res.json();
    setSaving(false);
    setMsg(res.ok ? { ok: true, text: `Saved attendance for ${json.saved} students.` } : { ok: false, text: json.error });
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="text-3xl font-bold">Attendance</h1>

      <div className="mt-5 flex flex-wrap items-end gap-3">
        <label className="text-sm font-medium">Class
          <select value={classId} onChange={(e) => setClassId(e.target.value)} className="mt-1 block rounded-md border border-slate-300 bg-white px-3 py-2">
            <option value="">Choose a class…</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.stream ? `${c.name} ${c.stream}` : c.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">Date
          <input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} className="mt-1 block rounded-md border border-slate-300 bg-white px-3 py-2" />
        </label>
        {rows.length > 0 && (
          <button onClick={() => setRows((rs) => rs.map((r) => ({ ...r, status: r.status ?? "PRESENT" })))}
                  className="rounded-md border border-slate-400 px-3 py-2 text-sm">
            Mark everyone else present
          </button>
        )}
      </div>

      {msg && <p role="status" className={`mt-4 rounded-md px-4 py-3 ${msg.ok ? "bg-emerald-100 text-emerald-900" : "bg-rose-100 text-rose-900"}`}>{msg.text}</p>}

      {classId && rows.length === 0 && !msg && <p className="mt-6 text-slate-600">No active students in this class yet.</p>}

      <ul className="mt-5 divide-y divide-slate-200 border-y border-slate-200">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <span>{r.firstName} {r.lastName} <span className="text-sm text-slate-500">{r.admissionNo}</span></span>
            <div className="flex gap-1" role="group" aria-label={`Attendance for ${r.firstName} ${r.lastName}`}>
              {OPTIONS.map((o) => (
                <button key={o.value} onClick={() => set(r.id, o.value)} aria-pressed={r.status === o.value}
                        className={`rounded border px-3 py-1.5 text-sm ${r.status === o.value ? o.on : "border-slate-300 bg-white text-slate-700"}`}>
                  {o.label}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>

      {rows.length > 0 && (
        <div className="mt-5 flex items-center gap-4">
          <button onClick={save} disabled={saving || unmarked === rows.length}
                  className="rounded-md bg-slate-900 px-5 py-2.5 font-semibold text-white disabled:opacity-50">
            {saving ? "Saving…" : "Save attendance"}
          </button>
          {unmarked > 0 && <span className="text-sm text-slate-600">{unmarked} not marked yet</span>}
        </div>
      )}
    </main>
  );
}
