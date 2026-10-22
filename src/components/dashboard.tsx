import { Banknote, CalendarCheck, ClipboardList, GraduationCap, School, User, Users } from "lucide-react";
import { ProgressChart } from "./progress-chart";
import { kes, money } from "@/lib/format";

export { kes, money };

const CHART_COLORS = ["#105ac9", "#000000", "#F59E0B", "#0F766E", "#7C3AED"];
const TONES = { sand: "bg-[#FBE9D9]", sky: "bg-[#DDEBF8]", mint: "bg-[#DCF2E4]", rose: "bg-[#F9E0E0]" } as const;
const card = "rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5";
const heading = "font-[family-name:var(--font-display)] text-lg font-bold";

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");
const sexLetter = (g: string) => (g ? ` (${g})` : "");

function timeAgo(iso: string | null) {
  if (!iso) return "";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function StatCard({ label, value, sub, tone, icon: Icon }: { label: string; value: string; sub?: string; tone: keyof typeof TONES; icon: React.ComponentType<{ size?: number; "aria-hidden"?: boolean }> }) {
  return (
    <div className={`rounded-2xl p-5 ${TONES[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-700">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white/70 text-[#105ac9]"><Icon size={22} aria-hidden={true} /></span>
      </div>
      {sub && <p className="mt-2 text-sm text-slate-600">{sub}</p>}
    </div>
  );
}

function Donut({ parts, total }: { parts: { label: string; value: number; color: string }[]; total: number }) {
  const R = 54, C = 2 * Math.PI * R;
  let used = 0;
  return (
    <div>
      <svg viewBox="0 0 140 140" role="img" aria-label={`${total} students. ${parts.map((p) => `${p.value} ${p.label}`).join(", ")}`} className="mx-auto w-48">
        <circle cx="70" cy="70" r={R} fill="none" stroke="#F0EAE7" strokeWidth="16" />
        {total > 0 && parts.filter((p) => p.value > 0).map((p) => {
          const len = (p.value / total) * C;
          const el = <circle key={p.label} cx="70" cy="70" r={R} fill="none" stroke={p.color} strokeWidth="16" strokeDasharray={`${Math.max(len - 2, 0)} ${C - Math.max(len - 2, 0)}`} strokeDashoffset={-used} transform="rotate(-90 70 70)" />;
          used += len;
          return el;
        })}
        <text x="70" y="66" textAnchor="middle" fontSize="11" fill="#64748B">Total</text>
        <text x="70" y="86" textAnchor="middle" fontSize="22" fontWeight="700" fill="#105ac9">{total}</text>
      </svg>
      <ul className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-2"><span className="size-3 rounded-full" style={{ background: p.color }} />{p.label} <span className="font-semibold">{p.value}</span></li>
        ))}
      </ul>
    </div>
  );
}

export type AdminData = {
  name: string; termLabel: string | null;
  stats: { students: number; teachers: number; parents: number; collected: number; outstanding: number };
  chart: { labels: string[]; series: { name: string; values: (number | null)[] }[] };
  gender: { male: number; female: number; unknown: number };
  star: { examName: string | null; rows: { id: number; name: string; gender: string; admissionNo: string; className: string; total: number; mean: number; grade: string }[] };
  recent: { who: string; amount: number; at: string | null }[];
};

export function AdminDashboard({ data }: { data: AdminData }) {
  const first = data.name.split(" ")[0];
  const { stats, gender } = data;
  return (
    <main className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-slate-600">Welcome back, {first}.{data.termLabel && ` Showing ${data.termLabel}.`}</p>
      </div>

      <section aria-label="Totals" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students" value={stats.students.toLocaleString("en-KE")} tone="sand" icon={GraduationCap} />
        <StatCard label="Teachers" value={stats.teachers.toLocaleString("en-KE")} tone="sky" icon={User} />
        <StatCard label="Parents" value={stats.parents.toLocaleString("en-KE")} tone="rose" icon={Users} />
        <StatCard label="Fees collected" value={money(stats.collected)} sub={`${money(stats.outstanding)} still outstanding`} tone="mint" icon={Banknote} />
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className={`${card} xl:col-span-2`}>
          <h2 className={heading}>Exam results</h2>
          <p className="mb-3 text-sm text-slate-600">Mean score in each exam, by form.</p>
          {data.chart.labels.length === 0 ? (
            <p className="py-10 text-center text-slate-500">No exams have been set up for the current term yet.</p>
          ) : (
            <ProgressChart labels={data.chart.labels} series={data.chart.series} colors={CHART_COLORS} />
          )}
        </section>

        <section className={card}>
          <h2 className={heading}>Students</h2>
          <p className="mb-4 text-sm text-slate-600">Boys and girls on the roll.</p>
          <Donut total={stats.students} parts={[
            { label: "Male", value: gender.male, color: "#105ac9" },
            { label: "Female", value: gender.female, color: "#F59E0B" },
            ...(gender.unknown > 0 ? [{ label: "Not recorded", value: gender.unknown, color: "#CBD5E1" }] : []),
          ]} />
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className={`${card} xl:col-span-2`}>
          <h2 className={heading}>Star students</h2>
          <p className="mb-3 text-sm text-slate-600">{data.star.examName ? `Top five in the whole school in ${data.star.examName}, by average.` : "Top students appear here once marks are entered."}</p>
          {data.star.rows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr><th className="py-2 pr-3 font-medium">Name</th><th className="pr-3 font-medium">Adm no</th><th className="pr-3 font-medium">Class</th><th className="pr-3 text-right font-medium">Marks</th><th className="pr-3 text-right font-medium">Average</th><th className="font-medium">Grade</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.star.rows.map((r) => (
                    <tr key={r.id}>
                      <td className="py-3 pr-3">
                        <span className="flex items-center gap-3">
                          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#FBE9D9] text-xs font-bold text-[#9A3412]" aria-hidden="true">{initials(r.name)}</span>
                          <span className="font-medium">{r.name}{sexLetter(r.gender)}</span>
                        </span>
                      </td>
                      <td className="pr-3">{r.admissionNo}</td><td className="pr-3 whitespace-nowrap">{r.className}</td>
                      <td className="pr-3 text-right tabular-nums">{r.total}</td><td className="pr-3 text-right font-semibold tabular-nums">{r.mean}%</td>
                      <td><span className="rounded-full bg-[#C2410C]/10 px-2.5 py-0.5 font-semibold text-[#9A3412]">{r.grade}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className={card}>
          <h2 className={heading}>Recent payments</h2>
          <p className="mb-3 text-sm text-slate-600">Fees paid by M-Pesa.</p>
          {data.recent.length === 0 ? (
            <p className="py-6 text-slate-500">No payments yet.</p>
          ) : (
            <ul className="space-y-4">
              {data.recent.map((p, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#DCF2E4] text-[#166534]" aria-hidden="true"><Banknote size={20} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{kes(p.amount)} paid</span>
                    <span className="block truncate text-sm text-slate-500">{p.who}</span>
                  </span>
                  <span className="shrink-0 text-xs text-slate-400">{timeAgo(p.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

export type TeacherData = {
  name: string;
  stats: { classes: number; students: number; waiting: number };
  classes: { id: number; label: string; students: number; subjects: string; registerTaken: boolean }[];
};

export function TeacherDashboard({ data }: { data: TeacherData }) {
  const first = data.name.split(" ")[0];
  return (
    <main className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
        <p className="text-slate-600">Welcome back, {first}.</p>
      </div>

      <section aria-label="Totals" className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Your classes" value={String(data.stats.classes)} tone="sand" icon={School} />
        <StatCard label="Students" value={String(data.stats.students)} tone="sky" icon={GraduationCap} />
        <StatCard label="Registers to take today" value={String(data.stats.waiting)} tone={data.stats.waiting ? "rose" : "mint"} icon={CalendarCheck} />
      </section>

      <section>
        <h2 className={`${heading} mb-3`}>Your classes</h2>
        {data.classes.length === 0 ? (
          <p className={`${card} text-slate-600`}>You haven't been assigned any classes yet. Ask an admin to assign you to your class.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.classes.map((c) => (
              <article key={c.id} className={card}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold">{c.label}</h3>
                    <p className="text-sm text-slate-600">{c.students} students</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${c.registerTaken ? "bg-[#DCF2E4] text-[#166534]" : "bg-[#FDE7D3] text-[#9A3412]"}`}>
                    {c.registerTaken ? "Register taken" : "Register not taken yet"}
                  </span>
                </div>
                <p className="mt-3 text-sm"><span className="text-slate-500">Marks you can enter:</span> {c.subjects}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a href="/admin/attendance" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#105ac9] px-4 text-sm font-semibold text-white hover:bg-[#431407]"><CalendarCheck size={16} aria-hidden="true" />Take attendance</a>
                  <a href="/admin/marks" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold hover:bg-slate-50"><ClipboardList size={16} aria-hidden="true" />Enter marks</a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
