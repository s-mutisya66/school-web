"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const field = "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base";

export default function ChangePassword() {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [admissionNo, setAdmissionNo] = useState("");
  const [mustChange, setMustChange] = useState(false);
  const [needsAdmission, setNeedsAdmission] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/auth/password").then(async (r) => {
      if (r.status === 401) return router.push("/login");
      if (r.ok) { const j = await r.json(); setMustChange(j.mustChange); setNeedsAdmission(j.needsAdmission); }
    });
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (next !== again) return setError("The two new passwords don't match.");
    setBusy(true);
    const res = await fetch("/api/auth/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ current, next, admissionNo }) });
    const json = await res.json().catch(() => ({ error: "Something went wrong. Please try again." }));
    setBusy(false);
    if (res.status === 401) return router.push("/login");
    if (!res.ok) return setError(json.error);
    router.push(json.redirect);
  }

  return (
    <main className="mx-auto max-w-sm px-5 py-16">
      <h1 className="text-3xl font-bold">Choose a new password</h1>
      <p className="mt-2 text-slate-600">
        {mustChange ? "Before you continue, choose your own password. Your current password is the first one you were given." : "Enter your current password, then choose a new one."}
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium">Current password
          <input type="password" required autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={field} />
        </label>
        {needsAdmission && (
          <label className="block text-sm font-medium">One of your children's admission numbers
            <input required value={admissionNo} onChange={(e) => setAdmissionNo(e.target.value)} className={field} />
            <span className="mt-1 block text-sm font-normal text-slate-600">This confirms it's really you. You can find it on a fee statement or school ID.</span>
          </label>
        )}
        <label className="block text-sm font-medium">New password (8+ characters)
          <input type="password" required minLength={8} autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className={field} />
        </label>
        <label className="block text-sm font-medium">New password again
          <input type="password" required minLength={8} autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} className={field} />
        </label>
        {error && <p role="alert" className="rounded-md bg-rose-100 px-3 py-2 text-rose-900">{error}</p>}
        <button disabled={busy} className="w-full rounded-md bg-slate-900 px-5 py-2.5 font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Save password"}</button>
      </form>
    </main>
  );
}
