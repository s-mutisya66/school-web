import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { Check, CalendarCheck, ClipboardList, FileSpreadsheet, TrendingUp, Users, Wallet } from "lucide-react";
import { DemoLogin } from "@/components/demo-login";
import { HeroPreview } from "@/components/hero-preview";

const display = Bricolage_Grotesque({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-display" });
const body = Figtree({ subsets: ["latin"] });

// Edit these.
const NAME = "School Management";
const AUTHOR = "Sidney";
const CONTACT_HREF = ""; // e.g. a link to your profile page. The link only shows when this is set.

// The page colours. Change them here and the whole page follows.
const BRAND = { "--brand": "#105AC9", "--brand-deep": "#0B3F8F", "--brand-night": "#082A66", "--accent": "#0DB2D3" } as CSSProperties;

export const metadata: Metadata = {
  title: `${NAME} (live demo)`,
  description: "A working school fees, attendance and report card system with simulated M-Pesa payments. Demo data only.",
  openGraph: {
    title: `${NAME} (live demo)`,
    description: "Parents pay school fees by M-Pesa. Teachers take the register and enter marks. Try it in one click.",
    type: "website",
  },
};

const heading = "font-[family-name:var(--font-display)] font-bold tracking-tight";

const steps = [
  ["The school sets the fees", "An admin enters the fee items for each class, then creates every student's invoice for the term in one click."],
  ["Parents pay by M-Pesa", "A parent enters their number, confirms on their phone, and the balance updates as soon as the payment is confirmed."],
  ["Teachers keep the records", "Daily registers and exam marks, class by class and subject by subject, entered only by the teachers responsible."],
  ["Report cards write themselves", "Grades, class position and overall position for every exam, ready to view, print or save as a PDF."],
];

const features = [
  { icon: Wallet, tone: "bg-[#FBE8D8]", title: "Termly fees and M-Pesa", text: "Itemised fees per class, one invoice per student each term, and payments that clear the oldest term first." },
  { icon: CalendarCheck, tone: "bg-[#DCEBF8]", title: "Attendance registers", text: "Present, late, absent or excused for every class every day, with a clear attendance rate for parents." },
  { icon: ClipboardList, tone: "bg-[#F9E0DF]", title: "Marks and report cards", text: "Each exam on its own, graded on the KCSE scale, with positions in class and across the whole form." },
  { icon: TrendingUp, tone: "bg-[#DCF2E4]", title: "Performance and rankings", text: "Class rankings, the best student in every subject, progress charts, and a PDF sheet for each form." },
  { icon: Users, tone: "bg-[#FDE7D3]", title: "Roles that are enforced", text: "Admins, teachers and parents each see only what they should. Teachers reach only their own classes and subjects." },
  { icon: FileSpreadsheet, tone: "bg-[#E5F7FA]", title: "Bulk import", text: "Upload a spreadsheet of students and their parents get logins automatically, with a sheet to hand out." },
];

const notes = [
  ["Money", "Stored as whole shillings, the same unit M-Pesa uses, so there are no rounding errors to chase."],
  ["M-Pesa", "The simulator follows the shape of Safaricom's Daraja requests and callbacks. A replayed callback can't credit a payment twice."],
  ["Access", "Admin, teacher and parent permissions are checked on the server, not just hidden in the interface."],
  ["Stack", "Next.js, TypeScript, Prisma and PostgreSQL (Neon), hosted on Vercel."],
];

const PARENT = { email: "parent@school.test", password: "parent123" };
const TEACHER = { email: "teacher@school.test", password: "teacher123" };

export default function Home() {
  return (
    <div style={BRAND} className={`${body.className} ${display.variable} scroll-smooth bg-[#F8FAFD] text-slate-900`}>
      <div className="relative overflow-hidden bg-[linear-gradient(135deg,var(--brand-deep)_0%,var(--brand)_62%,#1F7AE8_100%)] text-white">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -right-44 -top-48 size-[36rem] rounded-full bg-white/[0.06]" />
          <div className="absolute -bottom-40 -left-32 size-[26rem] rounded-full bg-[var(--accent)]/15" />
        </div>

        <header className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className={`${heading} flex size-9 items-center justify-center rounded-lg bg-[var(--accent)] text-lg text-white`}>S</span>
            <span className={`${heading} whitespace-nowrap text-lg`}>{NAME}</span>
          </Link>
          <nav aria-label="Page sections" className="hidden items-center gap-8 whitespace-nowrap text-sm text-white/85 md:flex">
            <a href="#how" className="hover:text-white">How it works</a>
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#tech" className="hover:text-white">Under the hood</a>
          </nav>
          <Link href="/login" className="rounded-lg border border-white/40 px-4 py-2 text-sm font-semibold hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Sign in</Link>
        </header>

        <section className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-10 lg:grid-cols-[1.05fr_1fr] lg:pb-28 lg:pt-16">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-medium ring-1 ring-white/25">
              <span className="size-2 rounded-full bg-[#F49D0B]" aria-hidden="true" />
              Live demo with made-up data
            </p>
            <h1 className={`${heading} mt-6 text-4xl font-extrabold leading-[1.04] sm:text-5xl lg:text-[3.6rem]`}>
              Fees, attendance and report cards for a <span className="text-[#8EE3F2]">Kenyan school.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/85">
              Parents pay by M-Pesa and follow their child's progress. Teachers take the register and enter marks. Pick a role and you're inside, with no sign-up.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <DemoLogin {...PARENT} label="Open the parent view" tone="light" />
              <DemoLogin {...TEACHER} label="Open the teacher view" tone="lightOutline" />
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/85">
              {["Simulated M-Pesa, no real money", "Roles enforced on the server", "Report cards as PDF"].map((t) => (
                <li key={t} className="flex items-center gap-2"><Check size={16} aria-hidden="true" className="text-[#8EE3F2]" />{t}</li>
              ))}
            </ul>
            <p className="mt-5 max-w-md text-sm text-white/70">The first click can take a few seconds while the free database wakes up.</p>
            <details className="mt-2 text-sm text-white/80">
              <summary className="cursor-pointer underline underline-offset-4">Prefer to type the details?</summary>
              <p className="mt-2 font-mono text-white/90">{PARENT.email} / {PARENT.password}<br />{TEACHER.email} / {TEACHER.password}</p>
            </details>
          </div>
          <HeroPreview />
        </section>
      </div>

      <section id="how" className="scroll-mt-4 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h2 className={`${heading} text-3xl sm:text-4xl`}>How a term runs</h2>
          <p className="mt-3 max-w-xl text-slate-600">From the first invoice to the final report card, in four steps.</p>
          <ol className="mt-12 grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {steps.map(([title, text], i) => (
              <li key={title} className="relative">
                <span className="flex items-center gap-3">
                  <span className={`${heading} flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-lg text-white`}>{i + 1}</span>
                  {i < steps.length - 1 && <span aria-hidden="true" className="hidden h-px flex-1 bg-slate-200 lg:block" />}
                </span>
                <h3 className={`${heading} mt-5 text-xl`}>{title}</h3>
                <p className="mt-2 leading-relaxed text-slate-600">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="features" className="scroll-mt-4 bg-[#F3F1EF]">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h2 className={`${heading} text-3xl sm:text-4xl`}>Everything the school office needs</h2>
          <p className="mt-3 max-w-xl text-slate-600">Built around how Kenyan schools actually run: termly fees, M-Pesa, streams and forms.</p>
          <div className="mt-12 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, tone, title, text }) => (
              <div key={title}>
                <span className={`flex size-12 items-center justify-center rounded-xl ${tone} text-[var(--brand)]`}><Icon size={24} aria-hidden="true" /></span>
                <h3 className={`${heading} mt-5 text-xl`}>{title}</h3>
                <p className="mt-2 leading-relaxed text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="tech" className="scroll-mt-4 bg-[var(--brand-night)] text-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className={`${heading} text-3xl sm:text-4xl`}>Built to hold up</h2>
            <p className="mt-4 max-w-sm leading-relaxed text-white/75">The details that matter when real money and real children's records are involved.</p>
          </div>
          <dl className="divide-y divide-white/15 border-y border-white/15">
            {notes.map(([k, v]) => (
              <div key={k} className="py-5 sm:grid sm:grid-cols-[8rem_1fr] sm:gap-6">
                <dt className={`${heading} text-lg text-[#8EE3F2]`}>{k}</dt>
                <dd className="mt-1 leading-relaxed text-white/80 sm:mt-0">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="border-t border-white/15">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-14 md:flex-row md:items-center">
            <div>
              <h2 className={`${heading} text-2xl sm:text-3xl`}>See it for yourself</h2>
              <p className="mt-2 text-white/75">No sign-up. Pick a role and look around.</p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <DemoLogin {...PARENT} label="Open the parent view" tone="light" />
              <DemoLogin {...TEACHER} label="Open the teacher view" tone="lightOutline" />
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[var(--brand-night)] text-sm text-white/65">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-white/15 px-5 py-6">
          <p>A portfolio project by {AUTHOR}. Every name and amount is fictional.</p>
          {CONTACT_HREF && <a href={CONTACT_HREF} className="font-medium text-white underline underline-offset-4">Work with me</a>}
        </div>
      </footer>
    </div>
  );
}
