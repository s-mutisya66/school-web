"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminDashboard, TeacherDashboard, type AdminData, type TeacherData } from "@/components/dashboard";

type Data = ({ role: "ADMIN" } & AdminData) | ({ role: "TEACHER" } & TeacherData);

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard").then(async (r) => {
      if (r.status === 401) return router.push("/login");
      if (r.status === 403) return router.push("/parent");
      if (!r.ok) return setError("The dashboard couldn't load. Please refresh in a few seconds.");
      setData(await r.json());
    });
  }, [router]);

  if (error) return <main className="p-6 text-slate-700">{error}</main>;
  if (!data) return <main className="p-6 text-slate-600">Loading your dashboard…</main>;
  return data.role === "ADMIN" ? <AdminDashboard data={data} /> : <TeacherDashboard data={data} />;
}
