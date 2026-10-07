"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminFees() {
  const router = useRouter();
  const [termId, setTermId] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch(`/api/terms/${termId}/invoices/generate`, { method: "POST" });
    setBusy(false);
    if (res.status === 401) return router.push("/login");
    if (res.status === 403) return setResult("Only administrators can generate invoices.");
    if (!res.ok) return setResult("Could not generate invoices. Check that the term ID exists.");
    const { invoicesCreated } = await res.json();
    setResult(
      invoicesCreated > 0
        ? `${invoicesCreated} invoices created.`
        : "No new invoices. Every student already has one for this term, or no fee items are set up for the term.",
    );
  }

  return (
    <main className="mx-auto max-w-xl px-5 py-12">
      <h1 className="text-3xl font-bold">Generate term invoices</h1>
      <p className="mt-2 text-slate-600">Creates one invoice per active student, using each class's fee items for the term. Running it again won't create duplicates.</p>
      <form onSubmit={generate} className="mt-6 flex items-end gap-3">
        <label className="block text-sm font-medium">
          Term ID
          <input value={termId} onChange={(e) => setTermId(e.target.value)} inputMode="numeric" required
                 className="mt-1 block w-32 rounded-md border border-slate-300 px-3 py-2 text-base" />
        </label>
        <button disabled={busy} className="rounded-md bg-slate-900 px-5 py-2.5 font-semibold text-white disabled:opacity-50">
          {busy ? "Generating…" : "Generate invoices"}
        </button>
      </form>
      {result && <p role="status" className="mt-4 rounded-md bg-slate-100 px-4 py-3">{result}</p>}
    </main>
  );
}
