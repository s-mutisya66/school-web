import { CalendarCheck, ClipboardList, GraduationCap, LayoutDashboard, TrendingUp } from "lucide-react";
import { ProgressChart } from "./progress-chart";

const TILES = [
  { label: "Students", value: "1,248", tone: "bg-[#FBE8D8]" },
  { label: "Teachers", value: "54", tone: "bg-[#DCEBF8]" },
  { label: "Parents", value: "986", tone: "bg-[#F9E0DF]" },
  { label: "Fees (KES)", value: "12.4M", tone: "bg-[#DCF2E4]" },
];
const NAV = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Students", icon: GraduationCap },
  { label: "Attendance", icon: CalendarCheck },
  { label: "Marks", icon: ClipboardList },
  { label: "Performance", icon: TrendingUp },
];

/** A decorative preview of the product: the admin dashboard, with a parent's fee card laid over its corner. */
export function HeroPreview() {
  return (
    <figure className="relative mx-auto w-full max-w-[34rem] sm:pb-12">
      <div aria-hidden="true" className="overflow-hidden rounded-2xl bg-[#F3F1EF] shadow-2xl shadow-black/30 ring-1 ring-white/20">
        <div className="flex h-9 items-center gap-3 bg-[var(--brand)] px-3">
          <span className="flex gap-1.5"><i className="size-2.5 rounded-full bg-white/40" /><i className="size-2.5 rounded-full bg-white/40" /><i className="size-2.5 rounded-full bg-white/40" /></span>
          <span className="flex size-5 items-center justify-center rounded bg-[var(--accent)] text-[10px] font-bold text-white">S</span>
          <span className="text-xs font-semibold text-white">School Management</span>
        </div>
        <div className="flex">
          <div className="hidden w-32 shrink-0 space-y-1 bg-white p-2 sm:block">
            {NAV.map(({ label, icon: Icon, active }) => (
              <div key={label} className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] ${active ? "bg-[#E5F7FA] font-semibold text-slate-900 shadow-[inset_2px_0_0_#2EAAC3]" : "text-slate-500"}`}>
                <Icon size={13} /> {label}
              </div>
            ))}
          </div>
          <div className="min-w-0 flex-1 space-y-3 p-3">
            <p className="font-[family-name:var(--font-display)] text-sm font-bold text-slate-900">Admin Dashboard</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {TILES.map((t) => (
                <div key={t.label} className={`rounded-lg p-2 ${t.tone}`}>
                  <p className="text-[9px] text-slate-600">{t.label}</p>
                  <p className="mt-0.5 whitespace-nowrap text-[13px] font-bold text-slate-900">{t.value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-white p-3">
              <p className="text-[11px] font-bold text-slate-900">Exam results</p>
              <ProgressChart
                legend={false}
                labels={["Opener", "Mid-term", "Mock", "End-term"]}
                colors={["#105AC9", "#0DB2D3", "#F49D0B"]}
                series={[
                  { name: "Form 1", values: [52, 58, 63, 70] },
                  { name: "Form 2", values: [55, 60, 66, 74] },
                  { name: "Form 3", values: [48, 55, 61, 67] },
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      <div aria-hidden="true" className="mx-auto mt-4 w-full max-w-xs rounded-2xl bg-white p-4 shadow-2xl shadow-black/25 ring-1 ring-black/5 sm:absolute sm:bottom-0 sm:left-0 sm:mx-0 sm:mt-0 sm:w-56 lg:-left-14">
        <p className="text-xs text-slate-500">Amani Otieno, Form 2 North</p>
        <p className="mt-0.5 font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900">KES 46,000</p>
        <p className="text-xs text-slate-500">still to pay this year</p>
        <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full w-[45%] rounded-full bg-[#0E8A4F]" /></div>
        <div className="mt-3 rounded-md bg-[#0E8A4F] py-2 text-center text-xs font-semibold text-white">Pay with M-Pesa</div>
      </div>

      <figcaption className="sr-only">A preview of the admin dashboard and a parent's fee card, with sample data.</figcaption>
    </figure>
  );
}
