"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/admin/students", label: "Students" },
  { href: "/admin/attendance", label: "Attendance" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/fees", label: "Fees" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-stone-50 text-slate-900">
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-5 py-3">
          {links.map((l) => (
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
