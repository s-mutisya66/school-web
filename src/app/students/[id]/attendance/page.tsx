"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { StudentHeader } from "@/components/student-header";
import { card, heading, Tile } from "@/components/ui";

type Status = "PRESENT" | "LATE" | "ABSENT" | "EXCUSED";
type Data = {
  summary: { present: number; late: number; absent: number; excused: number; rate: number | null };
  recent: { date: string; status: Status }[];
};

const LABEL: Record<Status, string> = { PRESENT: "Present", LATE: "Late", ABSENT: "Absent", EXCUSED: "Excused" };
const PILL: Record<Status, string> = {
  PRESENT: "bg-[#DCF2E4] text-[#166534]", LATE: "bg-[#FDE7D3] text-[#9A3412]",
  ABSENT: "bg-[#F9E0E0] text-[#991B1B]", EXCUSED: "bg-slate-200 text-slate-700",
};
const BAR: Record<Status, string> = { PRESENT: "bg-[#0E8A4F]", LATE: "bg-[#F59E0B]", ABSENT: "bg-[#BE123C]", EXCUSED: "bg-slate-400" };

export default function StudentAttendance() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/students/${id}/attendance`).then(async (r) => {
      if (r.status === 401) return router.push("/login");
      if (r.status === 403) return setError("You don't have access to this student's attendance.");
      if (r.ok) setData(await r.json());
    });
  }, [id, router]);

  const s = data?.summary;
  const counts: [Status, number][] = s ? [["PRESENT", s.present], ["LATE", s.late], ["ABSENT", s.absent], ["EXCUSED", s.excused]] : [];
  const total = counts.reduce((n, [, v]) => n + v, 0);

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <StudentHeader id={id} active="attendance" />

      {error ? (
        <p className="text-slate-700">{error}</p>
      ) : !data || !s ? (
        <p className="text-slate-600">Loading attendance…</p>
      ) : (
        <>
          <section aria-label="Attendance totals" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div className="sm:col-span-2 xl:col-span-1">
              <Tile label="Attendance rate" tone="sky" value={s.rate === null ? "No records" : `${s.rate}%`} sub="Excused days aren't counted; late counts as attended" />
            </div>
            <Tile label="Present" tone="mint" value={s.present} />
            <Tile label="Late" tone="amber" value={s.late} />
            <Tile label="Absent" tone="rose" value={s.absent} />
            <Tile label="Excused" tone="sand" value={s.excused} />
          </section>

          <div className="grid gap-6 lg:grid-cols-3">
            <section className={`${card} lg:col-span-2`}>
              <h2 className={heading}>Recent days</h2>
              <ul className="mt-3 divide-y divide-slate-200">
                {data.recent.length === 0 && <li className="py-4 text-slate-600">The class teacher hasn't marked attendance yet.</li>}
                {data.recent.map((r) => (
                  <li key={r.date} className="flex items-center justify-between py-3">
                    <span>{new Date(r.date).toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${PILL[r.status]}`}>{LABEL[r.status]}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className={card}>
              <h2 className={heading}>All recorded days</h2>
              {total === 0 ? (
                <p className="mt-3 text-slate-600">Nothing to show yet.</p>
              ) : (
                <>
                  <div className="mt-4 flex h-4 overflow-hidden rounded-full bg-slate-200" role="img" aria-label={counts.map(([k, v]) => `${v} ${LABEL[k].toLowerCase()}`).join(", ")}>
                    {counts.filter(([, v]) => v > 0).map(([k, v]) => <div key={k} className={BAR[k]} style={{ width: `${(v / total) * 100}%` }} />)}
                  </div>
                  <ul className="mt-4 space-y-2 text-sm">
                    {counts.map(([k, v]) => (
                      <li key={k} className="flex items-center justify-between">
                        <span className="flex items-center gap-2"><span className={`size-3 rounded-full ${BAR[k]}`} />{LABEL[k]}</span>
                        <span className="font-semibold">{v} <span className="font-normal text-slate-500">({Math.round((v / total) * 100)}%)</span></span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          </div>
        </>
      )}
    </main>
  );
}
