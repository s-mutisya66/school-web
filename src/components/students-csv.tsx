"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Preview = { admissionNo: string; name: string; gender: string; dob: string; class: string; parent: string; action: string };
type Result =
  | { ok: false; groups: { message: string; rows: number[] }[]; totalErrors: number; known: string[] }
  | { ok: true; created: number; updated: number; preview: Preview[] };

/** [34,35,36,40] becomes "Rows 34–36, 40". */
function fmtRows(rows: number[]) {
  const parts: string[] = [];
  for (let i = 0; i < rows.length; ) {
    let j = i;
    while (j + 1 < rows.length && rows[j + 1] === rows[j] + 1) j++;
    parts.push(j > i ? `${rows[i]}–${rows[j]}` : `${rows[i]}`);
    i = j + 1;
  }
  return `${rows.length === 1 ? "Row" : "Rows"} ${parts.join(", ")}`;
}

export function StudentsCsv({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [csv, setCsv] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  async function send(text: string, dryRun: boolean) {
    const res = await fetch("/api/students/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv: text, dryRun }),
    });
    if (res.status === 401) { router.push("/login"); return null; }
    const json = await res.json().catch(() => ({ error: "Something went wrong. Please try again." }));
    if (!res.ok) { setNote({ ok: false, text: json.error }); return null; }
    return json;
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setNote(null); setResult(null);
    if (file.size > 1_000_000) return setNote({ ok: false, text: "That file is too large. Split it into smaller files." });
    const text = await file.text();
    setBusy(true);
    const json = await send(text, true);
    setBusy(false);
    if (json) { setCsv(text); setFileName(file.name); setResult(json); }
  }

  async function confirm() {
    if (!csv) return;
    setBusy(true);
    const json = await send(csv, false);
    setBusy(false);
    if (json?.ok) {
      setNote({ ok: true, text: `Imported: ${json.created} new and ${json.updated} updated.` });
      setResult(null); setCsv(null); setFileName("");
      if (input.current) input.current.value = "";
      onDone();
    }
  }

  const btn = "rounded-md border border-slate-400 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50";

  return (
    <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="font-semibold">Import or export students (CSV)</h2>
      <p className="mt-1 text-sm text-slate-600">
        Columns: id, Admission No., FName, Lname, Gender, D.O.B, Stream, and an optional Parent Name. Students are matched by admission number, so the id column
        is ignored. Stream must match a class, such as Form 2 North. Dates are read day first (14/03/2010) or as 2010-03-14.
        On an update, a blank Gender, D.O.B or Parent Name leaves the saved value alone.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <a href="/api/students/export" download className={btn}>Download students</a>
        <a href="/api/students/export?template=1" download className={btn}>Download blank template</a>
        <label className={`${btn} cursor-pointer`}>
          Choose a CSV to upload
          <input ref={input} type="file" accept=".csv,text/csv" onChange={onFile} className="sr-only" />
        </label>
        {fileName && <span className="text-sm text-slate-600">{fileName}</span>}
        {busy && <span className="text-sm text-slate-600">Working…</span>}
      </div>

      {note && <p role="status" className={`mt-3 rounded-md px-3 py-2 text-sm ${note.ok ? "bg-emerald-100 text-emerald-900" : "bg-rose-100 text-rose-900"}`}>{note.text}</p>}

      {result && !result.ok && (
        <div role="alert" className="mt-3 rounded-md bg-rose-100 p-3 text-sm text-rose-900">
          <p className="font-medium">Nothing was imported. Fix these rows in your file and upload it again ({result.totalErrors} problem{result.totalErrors === 1 ? "" : "s"}):</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {result.groups.map((g, i) => <li key={i}>{fmtRows(g.rows)}: {g.message}</li>)}
          </ul>
          {result.known.length > 0 && <p className="mt-3">Your classes are: {result.known.join(", ")}.</p>}
        </div>
      )}

      {result?.ok && (
        <div className="mt-3">
          <p className="text-sm font-medium">This file will add {result.created} new student{result.created === 1 ? "" : "s"} and update {result.updated}. First rows:</p>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-300 text-slate-600">
                <tr><th className="py-1 pr-3"></th><th className="pr-3">Adm. no.</th><th className="pr-3">Name</th><th className="pr-3">Gender</th><th className="pr-3">Born</th><th className="pr-3">Class</th><th>Parent</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {result.preview.map((p) => (
                  <tr key={p.admissionNo}>
                    <td className="py-1 pr-3 font-medium">{p.action}</td><td className="pr-3">{p.admissionNo}</td><td className="pr-3">{p.name}</td>
                    <td className="pr-3">{p.gender}</td><td className="pr-3">{p.dob}</td><td className="pr-3">{p.class}</td><td>{p.parent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-sm text-slate-600">Check the dates in the Born column look right before you continue.</p>
          <button onClick={confirm} disabled={busy} className="mt-3 rounded-md bg-slate-900 px-5 py-2.5 font-semibold text-white disabled:opacity-50">
            Import {result.created + result.updated} students
          </button>
        </div>
      )}
    </section>
  );
}
