"use client";

import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

type Role = "ADMIN" | "TEACHER" | "PARENT";
const FULL: Record<Role, string> = { ADMIN: "Admin (Full access)", TEACHER: "Teacher (Own classes only)", PARENT: "Parent (Own children only)" };
const SHORT: Record<Role, string> = { ADMIN: "Admin", TEACHER: "Teacher", PARENT: "Parent" };

/** A small pill in the corner that says who you're signed in as, with a quick way to try another role. */
export function RoleBadge({ role }: { role: Role }) {
  const router = useRouter();

  async function switchRole() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  return (
    <div role="status" className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-full bg-white py-1.5 pl-3 pr-1.5 text-xs shadow-lg ring-1 ring-black/10 print:hidden">
      <ShieldCheck size={15} aria-hidden="true" className="shrink-0 text-[#105AC9]" />
      <span className="whitespace-nowrap">
        <span className="hidden text-slate-500 sm:inline">Logged in as: </span>
        <strong className="font-semibold text-slate-900"><span className="sm:hidden">{SHORT[role]}</span><span className="hidden sm:inline">{FULL[role]}</span></strong>
      </span>
      <button onClick={switchRole} className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#105AC9]">
        Switch role
      </button>
    </div>
  );
}
