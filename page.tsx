"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json().catch(() => ({ error: "Something went wrong. Please try again." }));
    setBusy(false);
    if (!res.ok) return setError(json.error);
    router.push(json.redirect);
  }

  return (
    <main className="mx-auto max-w-sm px-5 py-16">
      <h1 className="text-3xl font-bold">Sign in</h1>
      <p className="mt-2 text-slate-600">Parents see their children's fees. School staff manage invoices.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium">
          Email
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
                 className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-base" />
        </label>
        <label className="block text-sm font-medium">
          Password
          <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
                 className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-base" />
        </label>
        {error && <p role="alert" className="rounded-md bg-rose-100 px-3 py-2 text-rose-900">{error}</p>}
        <button disabled={busy} className="w-full rounded-md bg-slate-900 px-5 py-2.5 font-semibold text-white disabled:opacity-50">
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
