"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { kes } from "@/components/dashboard";

type Child = {
  id: number; firstName: string; lastName: string; admissionNo: string; className: string;
  balance: number; attendanceRate: number | null;
  latest: { exam: string; mean: number; grade: string; classPosition: number; classSize: number; formPosition: number; formSize: number } | null;
};

const initials = (c: Child) => `${c.firstName[0]}${c.lastName[0]}`.toUpperCase();

function Tile({ label, children, tone }: { label: string; children: React.ReactNode; tone: string }) {
  return (
    <div className={`rounded-xl p-4 ${tone}`}>
      <p className="text-sm text-slate-700">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Home() {
  const router = useRouter();
  const [children, setChildren] = useState<Child[] | null>(null);

  useEffect(() => {
    fetch("/api/parent/children").then(async (r) => {
      if (r.status === 401) return router.push("/login");
      if (r.ok) setChildren(await r.json());
    });
  }, [router]);

  if (!children) return <main className="p-6 text-slate-600">Loading…</main>;

  return (
    <main className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">My children</h1>
        <p className="text-slate-600">Fees, attendance and results at a glance.</p>
      </div>

      {children.length === 0 ? (
        <p className="rounded-2xl bg-white p-5 text-slate-600 shadow-sm ring-1 ring-black/5">No children are linked to your login yet. Please ask the school office to link them.</p>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {children.map((c) => (
            <article key={c.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <div className="flex items-center gap-4">
                <span className="grid size-14 shrink-0 place-items-center rounded-full bg-[#2A0800] text-lg font-bold text-white" aria-hidden="true">{initials(c)}</span>
                <div>
                  <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">{c.firstName} {c.lastName}</h2>
                  <p className="text-sm text-slate-600">{c.className}, admission {c.admissionNo}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <Tile label="Fee balance" tone={c.balance > 0 ? "bg-[#FDE7D3]" : "bg-[#DCF2E4]"}>
                  <p className="text-2xl font-bold">{c.balance > 0 ? kes(c.balance) : "Cleared"}</p>
                </Tile>
                <Tile label="Attendance" tone="bg-[#DDEBF8]">
                  <p className="text-2xl font-bold">{c.attendanceRate === null ? "No records" : `${c.attendanceRate}%`}</p>
                </Tile>
                <Tile label={c.latest ? `Latest: ${c.latest.exam}` : "Latest result"} tone="bg-[#FBE9D9]">
                  {c.latest ? (
                    <>
                      <p className="text-2xl font-bold">{c.latest.mean}% <span className="text-[#9A3412]">{c.latest.grade}</span></p>
                      <p className="mt-1 text-sm text-slate-700">Class {c.latest.classPosition}/{c.latest.classSize}, overall {c.latest.formPosition}/{c.latest.formSize}</p>
                    </>
                  ) : <p className="text-2xl font-bold">None yet</p>}
                </Tile>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <a href={`/students/${c.id}/fees`} className="inline-flex min-h-10 items-center rounded-lg bg-[#2A0800] px-4 text-sm font-semibold text-white hover:bg-[#431407]">Fees</a>
                <a href={`/students/${c.id}/attendance`} className="inline-flex min-h-10 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold hover:bg-slate-50">Attendance</a>
                <a href={`/students/${c.id}/report`} className="inline-flex min-h-10 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold hover:bg-slate-50">Report card</a>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

export default function MyChildren() {
  return (
    <AppShell>
      <Home />
    </AppShell>
  );
}
