"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type Role = "ADMIN" | "TEACHER" | "PARENT";

const links: { href: string; label: string; roles: Role[] }[] = [
  { href: "/admin/students", label: "Students", roles: ["ADMIN"] },
  { href: "/admin/attendance", label: "Attendance", roles: ["ADMIN", "TEACHER"] },
  { href: "/admin/marks", label: "Marks", roles: ["ADMIN", "TEACHER"] },
  { href: "/admin/performance", label: "Performance", roles: ["ADMIN"] },
  { href: "/admin/users", label: "Users", roles: ["ADMIN"] },
  { href: "/admin/fees", label: "Fees", roles: ["ADMIN"] },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then(async (r) => {
      if (r.status === 401) return router.push("/login");
      if (r.ok) setRole((await r.json()).role);
    });
  }, [router]);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-stone-50 text-slate-900">
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-5 py-3">
          {links.filter((l) => role && l.roles.includes(role)).map((l) => (
            <Link key={l.href} href={l.href}
                  aria-current={pathname.startsWith(l.href) ? "page" : undefined}
                  className={pathname.startsWith(l.href) ? "font-semibold underline underline-offset-8" : "text-slate-600 hover:text-slate-900"}>
              {l.label}
            </Link>
          ))}
          <button onClick={signOut} className="ml-auto text-sm text-slate-600 hover:text-slate-900">Sign out</button>
        </div>
      </nav>
      {children}
    </div>
  );
}
