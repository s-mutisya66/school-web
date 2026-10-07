"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Bricolage_Grotesque, Figtree } from "next/font/google";

const display = Bricolage_Grotesque({ subsets: ["latin"], weight: ["600", "700"] });
const body = Figtree({ subsets: ["latin"] });

type Invoice = {
  id: number; amountDue: number; amountPaid: number; status: "UNPAID" | "PARTIAL" | "PAID"; dueDate: string;
  term: { academicYear: string; termNumber: number };
};
type Payment = {
  id: number; amount: number; status: "PENDING" | "PAID" | "FAILED"; mpesaReceipt: string | null;
  failureReason: string | null; createdAt: string;
};
type Statement = { balance: number; invoices: Invoice[]; payments: Payment[] };

const kes = (n: number) => `KES ${n.toLocaleString("en-KE")}`;
const day = (d: string) => new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });

export default function FeeStatement() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<Statement | null>(null);
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "error" | "wait"; text: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/students/${id}/invoices`);
    if (res.status === 401) return router.push("/login");
    if (res.status === 403) return setNotice({ tone: "error", text: "You don't have access to this student's fees." });
    if (res.ok) setData(await res.json());
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  // Poll the pending payment every 2s until M-Pesa reports a result.
  useEffect(() => {
    if (!pendingId) return;
    const timer = setInterval(async () => {
      const res = await fetch(`/api/payments/${pendingId}`);
      if (!res.ok) return;
      const p: Payment = await res.json();
      if (p.status === "PENDING") return;
      clearInterval(timer);
      setPendingId(null);
      setNotice(
        p.status === "PAID"
          ? { tone: "ok", text: `Payment received. M-Pesa receipt ${p.mpesaReceipt}.` }
          : { tone: "error", text: "Payment cancelled. No money was taken. Check the number and try again." },
      );
      load();
    }, 2000);
    return () => clearInterval(timer);
  }, [pendingId, load]);

  async function pay(e: React.MouseEvent) {
    e.preventDefault();
    setNotice(null);
    const res = await fetch(`/api/students/${id}/payments/mpesa`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, amount: Number(amount) }),
    });
    const json = await res.json();
    if (!res.ok) return setNotice({ tone: "error", text: json.error });
    setPendingId(json.payment.id);
    setNotice({ tone: "wait", text: "Check your phone for the M-Pesa prompt and enter your PIN." });
  }

  async function simulate(success: boolean) {
    await fetch(`/api/payments/${pendingId}/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success }),
    });
  }

  if (!data) return <main className={`${body.className} p-8 text-slate-600`}>{notice?.text ?? "Loading fee statement…"}</main>;

  const due = data.invoices.reduce((s, i) => s + i.amountDue, 0);
  const paid = due - data.balance;

  return (
    <main className={`${body.className} min-h-screen bg-stone-50 text-slate-900`}>
      <div className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
        <p className="text-sm text-slate-500">Fee statement · Student {id}</p>
        <h1 className={`${display.className} mt-1 text-5xl font-bold tracking-tight sm:text-6xl`}>
          {data.balance > 0 ? kes(data.balance) : "Fees cleared"}
        </h1>
        <p className="mt-1 text-slate-600">
          {data.balance > 0 ? "outstanding across all terms" : "Nothing to pay right now."}
        </p>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200" role="img"
             aria-label={`${kes(paid)} paid of ${kes(due)}`}>
          <div className="h-full bg-emerald-600" style={{ width: `${due ? (paid / due) * 100 : 0}%` }} />
        </div>
        <p className="mt-2 text-sm text-slate-500">{kes(paid)} paid of {kes(due)} billed</p>

        <h2 className={`${display.className} mt-12 text-2xl font-semibold`}>Terms</h2>
        <ul className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
          {data.invoices.length === 0 && (
            <li className="py-4 text-slate-600">No invoices yet. The school office generates them at the start of each term.</li>
          )}
          {data.invoices.map((i) => (
            <li key={i.id} className="py-4">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-medium">Term {i.term.termNumber}, {i.term.academicYear}</span>
                <span className={i.status === "PAID" ? "text-emerald-700" : i.status === "PARTIAL" ? "text-amber-700" : "text-rose-700"}>
                  {i.status === "PAID" ? "Paid" : i.status === "PARTIAL" ? "Part paid" : "Unpaid"}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full bg-emerald-600" style={{ width: `${(i.amountPaid / i.amountDue) * 100}%` }} />
              </div>
              <p className="mt-1.5 text-sm text-slate-600">
                {kes(i.amountPaid)} of {kes(i.amountDue)} · due {day(i.dueDate)}
              </p>
            </li>
          ))}
        </ul>

        {data.balance > 0 && (
          <form className="mt-10 rounded-lg border-2 border-emerald-700 p-5">
            <h2 className={`${display.className} text-2xl font-semibold`}>Pay with M-Pesa</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                M-Pesa phone number
                <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="0712 345 678"
                       className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base" />
              </label>
              <label className="block text-sm font-medium">
                Amount (KES)
                <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric"
                       placeholder={String(data.balance)}
                       className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base" />
              </label>
            </div>
            <button onClick={pay} disabled={!!pendingId}
                    className="mt-4 rounded-md bg-emerald-700 px-5 py-2.5 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
              {pendingId ? "Waiting for M-Pesa…" : "Pay with M-Pesa"}
            </button>

            {pendingId && (process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_DEMO_MODE === "true") && (
              <div className="mt-4 flex flex-wrap items-center gap-2 rounded-md bg-slate-100 p-3 text-sm">
                <span className="text-slate-600">Demo mode, stands in for the customer's phone:</span>
                <button type="button" onClick={() => simulate(true)} className="rounded border border-slate-400 px-3 py-1">Enter PIN</button>
                <button type="button" onClick={() => simulate(false)} className="rounded border border-slate-400 px-3 py-1">Cancel</button>
              </div>
            )}
          </form>
        )}

        {notice && (
          <p role="status" className={`mt-4 rounded-md px-4 py-3 ${
            notice.tone === "ok" ? "bg-emerald-100 text-emerald-900" : notice.tone === "error" ? "bg-rose-100 text-rose-900" : "bg-sky-100 text-sky-900"}`}>
            {notice.text}
          </p>
        )}

        <h2 className={`${display.className} mt-12 text-2xl font-semibold`}>Payments</h2>
        <ul className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
          {data.payments.length === 0 && <li className="py-4 text-slate-600">No payments yet.</li>}
          {data.payments.map((p) => (
            <li key={p.id} className="flex items-baseline justify-between gap-4 py-3">
              <span>
                {kes(p.amount)}
                <span className="ml-2 text-sm text-slate-500">{day(p.createdAt)}</span>
              </span>
              <span className="text-sm text-slate-600">
                {p.status === "PAID" ? `Receipt ${p.mpesaReceipt}` : p.status === "PENDING" ? "Waiting" : "Cancelled"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
