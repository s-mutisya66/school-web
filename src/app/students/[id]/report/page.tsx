"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ReportSheet, type Report } from "@/components/report-sheet";

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

  return (
    <main className="min-h-screen bg-stone-100 text-slate-900 print:bg-white">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <select aria-label="Term" value={termId ?? ""} onChange={(e) => load(Number(e.target.value))} className="rounded-md border border-slate-300 bg-white px-3 py-2">
            {terms.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <div className="space-x-4 text-sm">
            <a href={`/students/${id}/fees`} className="underline">Fees</a>
            <a href="/parent" className="underline">My children</a>
            <button onClick={() => window.print()} className="underline">Print</button>
          </div>
        </div>
        <ReportSheet report={report} termLabel={terms.find((t) => t.id === termId)?.label ?? ""} />
      </div>
    </main>
  );
}
