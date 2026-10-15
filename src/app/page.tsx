import type { Metadata } from "next";
import Link from "next/link";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { DemoLogin } from "@/components/demo-login";

const display = Bricolage_Grotesque({ subsets: ["latin"], weight: ["600", "700", "800"] });
const body = Figtree({ subsets: ["latin"] });

// Edit these three.
const NAME = "School Management System";
const AUTHOR = "Sidney";
const CONTACT_HREF = ""; 

export const metadata: Metadata = {
  title: `${NAME} (live demo)`,
  description: "A working school fees, attendance and report card system with simulated M-Pesa payments. Demo data only.",
  openGraph: {
    title: `${NAME} (live demo)`,
    description: "Parents pay school fees by M-Pesa. Teachers take the register and enter marks. Try it in one click.",
    type: "website",
  },
};

const ink = "text-[#14213D]";

const terms = [
  { name: "Term 1", state: "Paid", paid: 28000, due: 28000 },
  { name: "Term 2", state: "Part paid", paid: 10000, due: 28000 },
  { name: "Term 3", state: "Unpaid", paid: 0, due: 28000 },
];
const kes = (n: number) => `KES ${n.toLocaleString("en-KE")}`;

const steps = [
  ["The school sets the fees", "An admin enters the fee items for each class, then creates every student's invoice for the term in one click."],
  ["Parents pay by M-Pesa", "A parent enters their number, confirms on their phone, and the balance updates as soon as the payment is confirmed. Older terms are cleared first."],
  ["Teachers keep the records", "Daily registers marked present, late, absent or excused, and exam marks entered class by class."],
  ["Report cards write themselves", "Grades, class averages and class position are worked out from the marks. Parents see only their own children."],
];

const notes = [
  ["Money", "Stored as whole shillings, the same unit M-Pesa uses, so there are no rounding errors to chase."],
  ["M-Pesa", "The simulator follows the shape of Safaricom's Daraja requests and callbacks. A replayed callback can't credit a payment twice."],
  ["Access", "Admin, teacher and parent permissions are checked on the server, not just hidden in the interface."],
  ["Stack", "Next.js, TypeScript, Prisma and PostgreSQL (Neon), hosted on Vercel."],
];

export default function Home() {
  return (
    <main className={`${body.className} min-h-screen bg-[#F6F8FB] ${ink}`}>
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .fill { transform-origin: left; animation: fill 1.1s cubic-bezier(.2,.7,.2,1) .4s both; }
          @keyframes fill { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        }
      `}</style>

      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <span className={`${display.className} text-lg font-bold`}>{NAME}</span>
        <Link href="/login" className="text-sm font-medium underline underline-offset-4 hover:text-[#0E8A4F]">Sign in</Link>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-8 lg:grid-cols-[1.05fr_.95fr] lg:pt-16">
        <div>
          <p className="inline-block rounded bg-[#F4C542] px-2.5 py-1 text-sm font-semibold">Live demo with made-up data</p>
          <h1 className={`${display.className} mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl`}>
            Fees, attendance and report cards for a Kenyan school.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-slate-700">
            Parents pay by M-Pesa and follow their child's progress. Teachers take the register and enter marks. Pick a role and
            you're inside, with no sign-up.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <DemoLogin email="parent@school.test" password="parent123" label="Open the parent view" tone="solid" />
            <DemoLogin email="teacher@school.test" password="teacher123" label="Open the teacher view" tone="outline" />
          </div>
          <p className="mt-4 max-w-md text-sm text-slate-600">
            M-Pesa is simulated, so no real money moves. The first click can take a few seconds while the free database wakes up.
          </p>
          <details className="mt-3 text-sm text-slate-600">
            <summary className="cursor-pointer underline underline-offset-4">Prefer to type the details?</summary>
            <p className="mt-2 font-mono">parent@school.test / parent123<br />teacher@school.test / teacher123</p>
          </details>
        </div>

        {/* A faithful sketch of the parent's fee statement, drawn in an exercise-book style. */}
        <figure>
          <div
            aria-hidden="true"
            className="relative rounded-lg border border-slate-300 bg-white py-6 pl-16 pr-6 shadow-sm before:absolute before:inset-y-0 before:left-11 before:w-px before:bg-rose-400"
          >
            <p className="text-sm text-slate-500">Amani Otieno, Form 2 North</p>
            <p className={`${display.className} mt-1 text-4xl font-bold`}>KES 46,000</p>
            <p className="text-sm text-slate-600">still to pay this year</p>
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200">
              <div className="fill h-full bg-[#0E8A4F]" style={{ width: "45%" }} />
            </div>
            <ul className="mt-5 border-t border-sky-200">
              {terms.map((t) => (
                <li key={t.name} className="flex items-baseline justify-between border-b border-sky-200 py-3">
                  <span className="font-medium">{t.name}</span>
                  <span className="text-sm text-slate-600">
                    {kes(t.paid)} of {kes(t.due)}
                    <span className={`ml-3 font-semibold ${t.state === "Paid" ? "text-emerald-700" : t.state === "Unpaid" ? "text-rose-700" : "text-amber-700"}`}>{t.state}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-5 rounded-md bg-[#0E8A4F] py-2.5 text-center font-semibold text-white">Pay with M-Pesa</div>
          </div>
          <figcaption className="mt-3 text-sm text-slate-500">What a parent sees. Sample data.</figcaption>
        </figure>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className={`${display.className} text-3xl font-bold tracking-tight`}>How a term runs</h2>
          <ol className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map(([title, text], i) => (
              <li key={title} className="border-t-4 border-[#14213D] pt-4">
                <span className="text-sm font-semibold text-slate-500">Step {i + 1}</span>
                <h3 className={`${display.className} mt-1 text-xl font-semibold`}>{title}</h3>
                <p className="mt-2 text-slate-600">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className={`${display.className} text-3xl font-bold tracking-tight`}>Built to hold up</h2>
        <dl className="mt-6 max-w-3xl divide-y divide-slate-300 border-y border-slate-300">
          {notes.map(([k, v]) => (
            <div key={k} className="py-4 sm:grid sm:grid-cols-[8rem_1fr] sm:gap-6">
              <dt className="font-semibold">{k}</dt>
              <dd className="mt-1 text-slate-700 sm:mt-0">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <footer className="border-t border-slate-300">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-sm text-slate-600">
          <p>A portfolio project by {AUTHOR}. Consider every name and amount as dummy data.</p>
          {CONTACT_HREF && <a href={CONTACT_HREF} className="font-medium underline underline-offset-4">Work with me</a>}
        </div>
      </footer>
    </main>
  );
}
