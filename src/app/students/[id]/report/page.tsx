"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Printer } from "lucide-react";
import { ReportSheet, type Report } from "@/components/report-sheet";
import { StudentHeader } from "@/components/student-header";

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

  return (
    <main className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6 print:max-w-none print:p-0">
      <StudentHeader id={id} active="report" compact />

      {error ? (
        <p className="text-slate-700">{error}</p>
      ) : !report ? (
        <p className="text-slate-600">Loading report card…</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
            <label className="flex items-center gap-2 text-sm font-medium">Term
              <select value={termId ?? ""} onChange={(e) => load(Number(e.target.value))} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-base font-normal">
                {terms.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </label>
            <button onClick={() => window.print()} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold hover:bg-slate-50">
              <Printer size={16} aria-hidden="true" /> Print or save as PDF
            </button>
          </div>
          <ReportSheet report={report} termLabel={terms.find((t) => t.id === termId)?.label ?? ""} />
        </>
      )}
    </main>
  );
}
