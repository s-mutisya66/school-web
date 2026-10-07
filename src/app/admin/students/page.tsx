"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Cls = { id: number; name: string; stream: string | null; _count: { students: number } };
type Parent = { id: number; name: string; email: string };
type Student = {
  id: number; admissionNo: string; firstName: string; lastName: string; status: string;
  schoolClass: Cls; guardians: Parent[];
};

const label = (c: { name: string; stream: string | null }) => (c.stream ? `${c.name} ${c.stream}` : c.name);
const input = "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base";

export default function Students() {
  const router = useRouter();
  const [classes, setClasses] = useState<Cls[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classId, setClassId] = useState("");
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [cls, setCls] = useState({ name: "", stream: "" });
  const [form, setForm] = useState({ admissionNo: "", firstName: "", lastName: "", schoolClassId: "", parentEmail: "" });

  async function call(url: string, method: string, body?: unknown) {
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    if (res.status === 401) { router.push("/login"); return null; }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setMsg(json.error ?? "Something went wrong."); return null; }
    setMsg(null);
    return json;
  }

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (classId) params.set("classId", classId);
    if (q.trim()) params.set("q", q.trim());
    const [c, s] = await Promise.all([call("/api/classes", "GET"), call(`/api/students?${params}`, "GET")]);
    if (c) setClasses(c);
    if (s) setStudents(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, q]);

  useEffect(() => { load(); }, [load]);

  async function addClass(e: React.FormEvent) {
    e.preventDefault();
    if (await call("/api/classes", "POST", cls)) { setCls({ name: "", stream: "" }); load(); }
  }

  async function addStudent(e: React.FormEvent) {
    e.preventDefault();
    const { parentEmail, ...rest } = form;
    const ok = await call("/api/students", "POST", {
      ...rest, schoolClassId: Number(rest.schoolClassId),
      guardianEmails: parentEmail.trim() ? [parentEmail] : [],
    });
    if (ok) { setForm({ ...form, admissionNo: "", firstName: "", lastName: "", parentEmail: "" }); load(); }
  }

  async function toggle(s: Student) {
    if (await call(`/api/students/${s.id}`, "PATCH", { status: s.status === "active" ? "inactive" : "active" })) load();
  }

  async function editParents(s: Student) {
    const current = s.guardians.map((g) => g.email).join(", ");
    const next = window.prompt("Parent emails, separated by commas", current);
    if (next === null) return;
    const emails = next.split(",").map((x) => x.trim()).filter(Boolean);
    if (await call(`/api/students/${s.id}`, "PATCH", { guardianEmails: emails })) load();
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <h1 className="text-3xl font-bold">Students</h1>
      {msg && <p role="alert" className="mt-4 rounded-md bg-rose-100 px-4 py-3 text-rose-900">{msg}</p>}

      <section className="mt-6 grid gap-6 md:grid-cols-2">
        <form onSubmit={addClass} className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-semibold">Add a class</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="text-sm font-medium">Name
              <input required value={cls.name} onChange={(e) => setCls({ ...cls, name: e.target.value })} placeholder="Form 2" className={input} />
            </label>
            <label className="text-sm font-medium">Stream (optional)
              <input value={cls.stream} onChange={(e) => setCls({ ...cls, stream: e.target.value })} placeholder="North" className={input} />
            </label>
          </div>
          <button className="mt-3 rounded-md bg-slate-900 px-4 py-2 font-semibold text-white">Add class</button>
        </form>

        <form onSubmit={addStudent} className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-semibold">Add a student</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="text-sm font-medium">Admission no.
              <input required value={form.admissionNo} onChange={(e) => setForm({ ...form, admissionNo: e.target.value })} className={input} />
            </label>
            <label className="text-sm font-medium">Class
              <select required value={form.schoolClassId} onChange={(e) => setForm({ ...form, schoolClassId: e.target.value })} className={input}>
                <option value="">Choose…</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{label(c)}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium">First name
              <input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={input} />
            </label>
            <label className="text-sm font-medium">Last name
              <input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className={input} />
            </label>
            <label className="col-span-2 text-sm font-medium">Parent email (optional)
              <input type="email" value={form.parentEmail} onChange={(e) => setForm({ ...form, parentEmail: e.target.value })} className={input} />
            </label>
          </div>
          <button className="mt-3 rounded-md bg-slate-900 px-4 py-2 font-semibold text-white">Add student</button>
        </form>
      </section>

      <div className="mt-8 flex flex-wrap items-end gap-3">
        <label className="text-sm font-medium">Class
          <select value={classId} onChange={(e) => setClassId(e.target.value)} className="mt-1 block rounded-md border border-slate-300 bg-white px-3 py-2">
            <option value="">All classes</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{label(c)} ({c._count.students})</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">Search
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or admission no." className="mt-1 block rounded-md border border-slate-300 bg-white px-3 py-2" />
        </label>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-slate-300 text-sm text-slate-600">
            <tr><th className="py-2 pr-4">Adm. no.</th><th className="pr-4">Name</th><th className="pr-4">Class</th><th className="pr-4">Parents</th><th /></tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {students.length === 0 && <tr><td colSpan={5} className="py-6 text-slate-600">No students found. Add a class, then add students to it.</td></tr>}
            {students.map((s) => (
              <tr key={s.id} className={s.status === "inactive" ? "text-slate-400" : ""}>
                <td className="py-3 pr-4">{s.admissionNo}</td>
                <td className="pr-4">{s.firstName} {s.lastName}{s.status === "inactive" && " (inactive)"}</td>
                <td className="pr-4">{label(s.schoolClass)}</td>
                <td className="pr-4">{s.guardians.length ? s.guardians.map((g) => g.name).join(", ") : "None linked"}</td>
                <td className="space-x-3 whitespace-nowrap text-sm">
                  <Link href={`/students/${s.id}/fees`} className="underline">Fees</Link>
                  <button onClick={() => editParents(s)} className="underline">Parents</button>
                  <button onClick={() => toggle(s)} className="underline">{s.status === "active" ? "Deactivate" : "Reactivate"}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
