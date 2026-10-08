import Link from "next/link";
import { Bricolage_Grotesque, Figtree } from "next/font/google";

const display = Bricolage_Grotesque({ subsets: ["latin"], weight: ["600", "700"] });
const body = Figtree({ subsets: ["latin"] });

const accounts = [
  { role: "Parent", email: "parent@school.test", password: "parent123", sees: "A child's fee statement, M-Pesa payments and attendance record." },
  { role: "Teacher", email: "teacher@school.test", password: "teacher123", sees: "The attendance register: mark a class present, late, absent or excused." },
];

const features = [
  ["Term fees", "Itemised fees per class, one invoice per student each term. Payments clear the oldest term first."],
  ["Simulated M-Pesa", "A fake STK Push with the same request and callback shapes as Safaricom's Daraja API, so a real integration is a drop-in swap."],
  ["Roles that are enforced", "Admin, teacher and parent access is checked on the server. A parent can't read another family's records."],
  ["Attendance", "Daily registers by class, and a parent view with an attendance rate."],
];

export default function Home() {
  return (
    <main className={`${body.className} min-h-screen bg-stone-50 text-slate-900`}>
      <div className="mx-auto max-w-3xl px-5 py-12 sm:py-20">
        <p className="text-sm font-medium text-emerald-800">Portfolio project · demo data only</p>
        <h1 className={`${display.className} mt-2 text-4xl font-bold tracking-tight sm:text-6xl`}>
          School management for fees, attendance and parents.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-slate-600">
          A working school system built for the way Kenyan schools collect fees: termly invoices and M-Pesa. Everything here is
          simulated. No real money moves and every name is made up.
        </p>
        <Link href="/login" className="mt-6 inline-block rounded-md bg-emerald-700 px-6 py-3 font-semibold text-white hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
          Sign in to the demo
        </Link>

        <h2 className={`${display.className} mt-14 text-2xl font-semibold`}>Try it with a demo account</h2>
        <ul className="mt-4 space-y-3">
          {accounts.map((a) => (
            <li key={a.role} className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="font-semibold">{a.role}</p>
              <p className="mt-1 font-mono text-sm">{a.email} / {a.password}</p>
              <p className="mt-1 text-sm text-slate-600">{a.sees}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-slate-500">
          The first page can take a few seconds to load, because the free database sleeps when idle. The admin side (students,
          users, invoicing) is shown in the README screenshots, or ask me for a walkthrough.
        </p>

        <h2 className={`${display.className} mt-14 text-2xl font-semibold`}>What it does</h2>
        <dl className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
          {features.map(([t, d]) => (
            <div key={t} className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="font-semibold">{t}</dt>
              <dd className="mt-1 text-slate-600 sm:col-span-2 sm:mt-0">{d}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-10 text-sm text-slate-500">Built with Next.js, Prisma and PostgreSQL (Neon), deployed on Vercel.</p>
      </div>
    </main>
  );
}
