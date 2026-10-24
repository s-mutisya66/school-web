"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Tone = "solid" | "outline" | "light" | "lightOutline";
type Props = { email: string; password: string; label: string; tone: Tone };

// The colours come from CSS variables set on the page (--brand, --brand-deep), so restyling is one edit.
const TONES: Record<Tone, string> = {
  solid: "bg-[var(--brand)] text-white hover:bg-[var(--brand-deep)] focus-visible:outline-[var(--brand)]",
  outline: "border-2 border-[var(--brand)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white focus-visible:outline-[var(--brand)]",
  light: "bg-white text-[var(--brand)] shadow-lg shadow-black/10 hover:bg-sky-50 focus-visible:outline-white",
  lightOutline: "border-2 border-white/60 text-white hover:bg-white/10 focus-visible:outline-white",
};

/** One-click sign-in for the public demo accounts. */
export function DemoLogin({ email, password, label, tone }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json().catch(() => ({ error: "Something went wrong. Please try again." }));
    if (!res.ok) {
      setBusy(false);
      return setError(json.error);
    }
    router.push(json.redirect);
  }

  return (
    <div>
      <button
        onClick={go}
        disabled={busy}
        className={`min-h-12 w-full rounded-lg px-6 py-3 font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 sm:w-auto ${TONES[tone]}`}
      >
        {busy ? "Opening the demo…" : label}
      </button>
      {error && <p role="alert" className={`mt-2 text-sm ${tone.startsWith("light") ? "text-rose-100" : "text-rose-700"}`}>{error}</p>}
    </div>
  );
}
