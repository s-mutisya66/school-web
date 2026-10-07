"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = { id: number; name: string; email: string; role: "ADMIN" | "TEACHER" | "PARENT"; children: { id: number; firstName: string; lastName: string }[] };

const input = "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base";

export default function Users() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role: "PARENT", password: "" });

  const load = useCallback(async () => {
    const res = await fetch("/api/users");
    if (res.status === 401) return router.push("/login");
    if (res.status === 403) return setMsg({ ok: false, text: "Only administrators can manage users." });
    setUsers(await res.json());
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
          <tr><th className="py-2 pr-4">Name</th><th className="pr-4">Email</th><th className="pr-4">Role</th><th>Children</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {users.map((u) => (
            <tr key={u.id}>
              <td className="py-3 pr-4">{u.name}</td>
              <td className="pr-4">{u.email}</td>
              <td className="pr-4">{u.role === "ADMIN" ? "Admin" : u.role === "TEACHER" ? "Teacher" : "Parent"}</td>
              <td>{u.role === "PARENT" ? (u.children.length ? u.children.map((c) => `${c.firstName} ${c.lastName}`).join(", ") : "None linked") : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
