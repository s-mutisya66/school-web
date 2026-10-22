"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

type Summary = { id: number; name: string; className: string; admissionNo: string; viewer: "ADMIN" | "TEACHER" | "PARENT" };

const TABS = [
  { key: "fees", label: "Fees", path: "fees" },
  { key: "attendance", label: "Attendance", path: "attendance" },
  { key: "report", label: "Report card", path: "report" },
] as const;

/** Who the page is about, a way back, and tabs between a student's fees, attendance and report card. */
export function StudentHeader({ id, active, compact }: { id: string; active: (typeof TABS)[number]["key"]; compact?: boolean }) {
  const router = useRouter();
  const [s, setS] = useState<Summary | null>(null);

  useEffect(() => {
    fetch(`/api/students/${id}/summary`).then(async (r) => {
      if (r.status === 401) return router.push("/login");
      if (r.ok) setS(await r.json());
    });
  }, [id, router]);

  const back = s?.viewer === "ADMIN" ? { href: "/admin/students", label: "Students" } : s?.viewer === "TEACHER" ? { href: "/admin", label: "Dashboard" } : { href: "/parent", label: "My children" };
  // Teachers see report cards only; fees and attendance summaries are for parents and admins.
  const tabs = TABS.filter((t) => s?.viewer !== "TEACHER" || t.key === "report");

  return (
    <header className="print:hidden">
      <Link href={back.href} className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"><ChevronLeft size={16} aria-hidden="true" />{back.label}</Link>
      {!compact && s && (
        <div className="mt-1">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">{s.name}</h1>
          <p className="text-slate-600">{s.className}, admission {s.admissionNo}</p>
        </div>
      )}
      <nav aria-label="Student pages" className="mt-3 flex gap-1 overflow-x-auto border-b border-slate-300">
        {tabs.map((t) => (
          <Link key={t.key} href={`/students/${id}/${t.path}`} aria-current={t.key === active ? "page" : undefined}
                className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 font-medium ${t.key === active ? "border-[#C2410C] text-[#9A3412]" : "border-transparent text-slate-600 hover:text-slate-900"}`}>
            {t.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
