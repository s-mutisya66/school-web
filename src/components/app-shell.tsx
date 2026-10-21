"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { CalendarCheck, ClipboardList, GraduationCap, KeyRound, LayoutDashboard, LogOut, Menu, Search, TrendingUp, Users, Wallet, X } from "lucide-react";

const display = Bricolage_Grotesque({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-display" });
const body = Figtree({ subsets: ["latin"] });

const BRAND = "School Management";
type Role = "ADMIN" | "TEACHER" | "PARENT";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "TEACHER"], exact: true },
  { href: "/admin/students", label: "Students", icon: GraduationCap, roles: ["ADMIN"] },
  { href: "/admin/attendance", label: "Attendance", icon: CalendarCheck, roles: ["ADMIN", "TEACHER"] },
  { href: "/admin/marks", label: "Marks", icon: ClipboardList, roles: ["ADMIN", "TEACHER"] },
  { href: "/admin/performance", label: "Performance", icon: TrendingUp, roles: ["ADMIN"] },
  { href: "/admin/fees", label: "Fees", icon: Wallet, roles: ["ADMIN"] },
  { href: "/admin/users", label: "Users", icon: Users, roles: ["ADMIN"] },
  { href: "/parent", label: "My children", icon: GraduationCap, roles: ["PARENT"], exact: true },
  { href: "/account/password", label: "Password", icon: KeyRound, roles: ["ADMIN", "TEACHER", "PARENT"] },
] as const;

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");

/** The frame around every signed-in staff and parent home page: dark header, sidebar, content. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<{ name: string; role: Role } | null>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then(async (r) => {
      if (r.status === 401) return router.push("/login");
      if (r.ok) setMe(await r.json());
    });
  }, [router]);

  useEffect(() => setOpen(false), [pathname]);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const links = NAV.filter((l) => me && (l.roles as readonly string[]).includes(me.role));
  const isActive = (l: (typeof NAV)[number]) => ("exact" in l && l.exact ? pathname === l.href : pathname.startsWith(l.href));

  const nav = (
    <nav aria-label="Main" className="space-y-1">
      {links.map((l) => {
        const active = isActive(l);
        const Icon = l.icon;
        return (
          <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-[15px] transition-colors ${active ? "bg-[#C2410C]/10 font-semibold text-[#9A3412] shadow-[inset_3px_0_0_#C2410C]" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}>
            <Icon size={19} aria-hidden="true" /> {l.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className={`${body.className} ${display.variable} min-h-screen bg-[#F4F1EF] text-slate-900`}>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 bg-[#2A0800] px-4 text-white shadow-md">
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="grid size-10 place-items-center rounded-lg hover:bg-white/10 lg:hidden">
          <Menu size={22} />
        </button>
        <Link href="/admin" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-lg bg-[#C2410C] font-[family-name:var(--font-display)] text-lg font-bold">S</span>
          <span className="hidden whitespace-nowrap font-[family-name:var(--font-display)] text-lg font-bold sm:inline">{BRAND}</span>
        </Link>

        {me?.role === "ADMIN" && (
          <form role="search" onSubmit={(e) => { e.preventDefault(); if (search.trim()) router.push(`/admin/students?q=${encodeURIComponent(search.trim())}`); }}
                className="ml-2 hidden max-w-md flex-1 items-center gap-2 rounded-full bg-white/10 px-4 focus-within:bg-white/20 md:flex lg:ml-10">
            <Search size={17} aria-hidden="true" className="text-white/70" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search students" placeholder="Search students by name or admission no."
                   className="h-10 w-full bg-transparent text-sm text-white outline-none placeholder:text-white/60" />
          </form>
        )}

        <div className="ml-auto flex items-center gap-3">
          {me && (
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-full bg-[#F59E0B] text-sm font-bold text-[#2A0800]" aria-hidden="true">{initials(me.name)}</span>
              <span className="hidden leading-tight sm:block">
                <span className="block text-sm font-semibold">{me.name}</span>
                <span className="block text-xs capitalize text-white/70">{me.role.toLowerCase()}</span>
              </span>
            </div>
          )}
          <button onClick={signOut} aria-label="Sign out" title="Sign out" className="grid size-10 place-items-center rounded-lg hover:bg-white/10"><LogOut size={19} /></button>
        </div>
      </header>

      <div className="flex">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 overflow-y-auto border-r border-black/5 bg-white p-3 lg:block">{nav}</aside>

        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button aria-label="Close menu" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/50" />
            <aside className="absolute inset-y-0 left-0 w-64 bg-white p-3 shadow-xl">
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="font-[family-name:var(--font-display)] text-lg font-bold">{BRAND}</span>
                <button onClick={() => setOpen(false)} aria-label="Close menu" className="grid size-10 place-items-center rounded-lg hover:bg-slate-100"><X size={20} /></button>
              </div>
              {nav}
            </aside>
          </div>
        )}

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
