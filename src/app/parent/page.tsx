"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Child = { id: number; firstName: string; lastName: string; admissionNo: string; className: string };

export default function MyChildren() {
  const router = useRouter();
  const [children, setChildren] = useState<Child[] | null>(null);

  useEffect(() => {
    fetch("/api/parent/children").then(async (r) => {
      if (r.status === 401) return router.push("/login");
      if (r.ok) setChildren(await r.json());
    });
  }, [router]);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  if (!children) return <main className="p-8 text-slate-600">Loading…</main>;

  return (
    <main className="min-h-screen bg-stone-50 text-slate-900">
      <div className="mx-auto max-w-2xl px-5 py-10 sm:py-14">
        <div className="flex items-baseline justify-between">
          <h1 className="text-4xl font-bold tracking-tight">My children</h1>
          <span className="space-x-4 text-sm">
            <a href="/account/password" className="underline">Password</a>
            <button onClick={signOut} className="underline">Sign out</button>
          </span>
        </div>

        {children.length === 0 ? (
          <p className="mt-6 rounded-md bg-white p-4 text-slate-600">No children are linked to your login yet. Please ask the school office to link them.</p>
        ) : (
          <ul className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
            {children.map((c) => (
              <li key={c.id} className="py-4">
                <p className="text-xl font-semibold">{c.firstName} {c.lastName}</p>
                <p className="text-sm text-slate-600">{c.className}, admission {c.admissionNo}</p>
                <p className="mt-2 space-x-5 text-sm font-medium">
                  <a href={`/students/${c.id}/fees`} className="underline">Fees</a>
                  <a href={`/students/${c.id}/attendance`} className="underline">Attendance</a>
                  <a href={`/students/${c.id}/report`} className="underline">Report card</a>
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
