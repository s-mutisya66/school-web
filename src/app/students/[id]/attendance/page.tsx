"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Data = {
  summary: { present: number; late: number; absent: number; excused: number; rate: number | null };
  recent: { date: string; status: "PRESENT" | "LATE" | "ABSENT" | "EXCUSED" }[];
};

const LABEL = { PRESENT: "Present", LATE: "Late", ABSENT: "Absent", EXCUSED: "Excused" } as const;
const TONE = { PRESENT: "text-emerald-700", LATE: "text-amber-700", ABSENT: "text-rose-700", EXCUSED: "text-slate-600" } as const;

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

  if (error) return <main className="p-8 text-slate-700">{error}</main>;
  if (!data) return <main className="p-8 text-slate-600">Loading attendance…</main>;

  const s = data.summary;
  return (
    <main className="min-h-screen bg-stone-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
        <div className="flex items-baseline justify-between text-sm text-slate-500">
          <p>Attendance · Student {id}</p>
          <a href={`/students/${id}/fees`} className="underline">Fees</a>
        </div>
        <h1 className="mt-1 text-5xl font-bold tracking-tight sm:text-6xl">{s.rate === null ? "No records yet" : `${s.rate}%`}</h1>
        {s.rate !== null && <p className="mt-1 text-slate-600">attendance rate (excused days not counted, late counts as attended)</p>}

        <dl className="mt-6 grid grid-cols-4 gap-3 text-center">
          {([["Present", s.present], ["Late", s.late], ["Absent", s.absent], ["Excused", s.excused]] as const).map(([k, v]) => (
            <div key={k} className="rounded-lg border border-slate-200 bg-white py-3">
              <dd className="text-2xl font-semibold">{v}</dd>
              <dt className="text-sm text-slate-600">{k}</dt>
            </div>
          ))}
        </dl>

        <h2 className="mt-10 text-2xl font-semibold">Recent days</h2>
        <ul className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
          {data.recent.length === 0 && <li className="py-4 text-slate-600">Your child's teacher hasn't marked attendance yet.</li>}
          {data.recent.map((r) => (
            <li key={r.date} className="flex justify-between py-3">
              <span>{new Date(r.date).toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}</span>
              <span className={TONE[r.status]}>{LABEL[r.status]}</span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
