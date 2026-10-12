"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { email: string; password: string; label: string; tone: "solid" | "outline" };

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
        className={`min-h-12 w-full rounded-md px-5 py-3 font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E8A4F] disabled:opacity-60 sm:w-auto ${
          tone === "solid"
            ? "bg-[#0E8A4F] text-white hover:bg-[#0B7541]"
            : "border-2 border-[#14213D] text-[#14213D] hover:bg-[#14213D] hover:text-white"
        }`}
      >
        {busy ? "Opening the demo…" : label}
      </button>
      {error && <p role="alert" className="mt-2 text-sm text-rose-700">{error}</p>}
    </div>
  );
}
