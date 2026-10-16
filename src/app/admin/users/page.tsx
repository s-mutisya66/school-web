"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Cls = { id: number; name: string; stream: string | null };
type Subj = { id: number; name: string };
type Assignment = { schoolClassId: number; subjectId: number | null; schoolClass: Cls; subject: Subj | null };
type User = {
  id: number; name: string; email: string; role: "ADMIN" | "TEACHER" | "PARENT";
  children: { id: number; firstName: string; lastName: string }[];
  assignments: Assignment[];
};
type Draft = Record<number, { all: boolean; subjectIds: number[] }>;

const label = (c: Cls) => (c.stream ? `${c.name} ${c.stream}` : c.name);
const ROLE = { ADMIN: "Admin", TEACHER: "Teacher", PARENT: "Parent" } as const;
const input = "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base";

function toDraft(rows: Assignment[]): Draft {
  const d: Draft = {};
  for (const r of rows) {
    const e = (d[r.schoolClassId] ??= { all: false, subjectIds: [] });
    if (r.subjectId === null) e.all = true; else e.subjectIds.push(r.subjectId);
  }
  return d;
}

function summarise(rows: Assignment[]) {
  const by = new Map<number, { cls: Cls; all: boolean; names: string[] }>();
  for (const r of rows) {
    const e = by.get(r.schoolClassId) ?? { cls: r.schoolClass, all: false, names: [] };
    if (r.subject) e.names.push(r.subject.name); else e.all = true;
    by.set(r.schoolClassId, e);
  }
  return [...by.values()].map((e) => `${label(e.cls)}: ${e.all ? "all subjects" : e.names.sort().join(", ")}`);
}

export default function Users() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<Cls[]>([]);
  const [subjects, setSubjects] = useState<Subj[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role: "PARENT", password: "" });
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>({});

  const load = useCallback(async () => {
    const [u, c, s] = await Promise.all([fetch("/api/users"), fetch("/api/classes"), fetch("/api/subjects")]);
    if (u.status === 401) return router.push("/login");
    if (u.status === 403) return setMsg({ ok: false, text: "Only administrators can manage users." });
    setUsers(await u.json());
    if (c.ok) setClasses(await c.json());
    if (s.ok) setSubjects(await s.json());
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const json = await res.json();
    if (!res.ok) return setMsg({ ok: false, text: json.error });
    setMsg({ ok: true, text: `Account created for ${json.name}. Share the temporary password with them privately.` });
    setForm({ ...form, name: "", email: "", password: "" });
    load();
  }

  async function save() {
    const assignments = Object.entries(draft).map(([classId, d]) => ({ classId: Number(classId), subjectIds: d.all ? null : d.subjectIds }));
    const res = await fetch(`/api/users/${editing}/classes`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assignments }) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return setMsg({ ok: false, text: json.error ?? "Something went wrong." });
    setMsg({ ok: true, text: "Assignments updated. They apply the next time the teacher loads a page." });
    setEditing(null);
    load();
  }

  const toggleClass = (id: number) => setDraft((d) => { const n = { ...d }; if (id in n) delete n[id]; else n[id] = { all: true, subjectIds: [] }; return n; });
  const setAll = (id: number, all: boolean) => setDraft((d) => ({ ...d, [id]: { ...d[id], all } }));
  const toggleSubject = (id: number, sid: number) =>
    setDraft((d) => ({ ...d, [id]: { ...d[id], subjectIds: d[id].subjectIds.includes(sid) ? d[id].subjectIds.filter((x) => x !== sid) : [...d[id].subjectIds, sid] } }));

  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <h1 className="text-3xl font-bold">Users</h1>
      {msg && <p role="status" className={`mt-4 rounded-md px-4 py-3 ${msg.ok ? "bg-emerald-100 text-emerald-900" : "bg-rose-100 text-rose-900"}`}>{msg.text}</p>}

      <form onSubmit={create} className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="font-semibold">Add a teacher or parent</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">Full name
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} />
          </label>
          <label className="text-sm font-medium">Email
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={input} />
          </label>
          <label className="text-sm font-medium">Role
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={input}>
              <option value="PARENT">Parent</option>
              <option value="TEACHER">Teacher</option>
            </select>
          </label>
          <label className="text-sm font-medium">Temporary password (8+ characters)
            <input required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={input} />
          </label>
        </div>
        <button className="mt-3 rounded-md bg-slate-900 px-4 py-2 font-semibold text-white">Create account</button>
      </form>

      <table className="mt-8 w-full text-left">
        <thead className="border-b border-slate-300 text-sm text-slate-600">
          <tr><th className="py-2 pr-4">Name</th><th className="pr-4">Email</th><th className="pr-4">Role</th><th>Children or assignments</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {users.map((u) => (
            <Fragment key={u.id}>
              <tr>
                <td className="py-3 pr-4 align-top">{u.name}</td>
                <td className="pr-4 align-top">{u.email}</td>
                <td className="pr-4 align-top">{ROLE[u.role]}</td>
                <td className="py-3 align-top">
                  {u.role === "PARENT" && (u.children.length ? u.children.map((c) => `${c.firstName} ${c.lastName}`).join(", ") : "None linked")}
                  {u.role === "TEACHER" && (
                    <>
                      {u.assignments.length ? <ul className="text-sm">{summarise(u.assignments).map((l) => <li key={l}>{l}</li>)}</ul> : <span className="text-sm text-slate-600">No classes assigned</span>}
                      <button onClick={() => { setEditing(u.id); setDraft(toDraft(u.assignments)); }} className="mt-1 text-sm underline">Edit assignments</button>
                    </>
                  )}
                </td>
              </tr>
              {editing === u.id && (
                <tr>
                  <td colSpan={4} className="bg-slate-50 p-4">
                    <p className="text-sm font-medium">What {u.name} can work with. For each class, choose all subjects or only some.</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {classes.map((c) => (
                        <div key={c.id} className="rounded-md border border-slate-200 bg-white p-3">
                          <label className="flex items-center gap-2 font-medium">
                            <input type="checkbox" checked={c.id in draft} onChange={() => toggleClass(c.id)} /> {label(c)}
                          </label>
                          {c.id in draft && (
                            <div className="ml-6 mt-2 text-sm">
                              <label className="flex items-center gap-2">
                                <input type="checkbox" checked={draft[c.id].all} onChange={(e) => setAll(c.id, e.target.checked)} /> All subjects
                              </label>
                              {!draft[c.id].all && (
                                subjects.length === 0
                                  ? <p className="mt-1 text-slate-600">No subjects yet. Add them on the Marks page.</p>
                                  : <div className="mt-1 grid gap-1">
                                      {subjects.map((s) => (
                                        <label key={s.id} className="flex items-center gap-2">
                                          <input type="checkbox" checked={draft[c.id].subjectIds.includes(s.id)} onChange={() => toggleSubject(c.id, s.id)} /> {s.name}
                                        </label>
                                      ))}
                                    </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-sm text-slate-600">A teacher can take attendance, see students and open report cards for every class ticked here. Entering marks is limited to the subjects chosen.</p>
                    <div className="mt-3 space-x-3">
                      <button onClick={save} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Save assignments</button>
                      <button onClick={() => setEditing(null)} className="text-sm underline">Cancel</button>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </main>
  );
}
