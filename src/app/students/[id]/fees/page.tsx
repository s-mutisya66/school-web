"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { StudentHeader } from "@/components/student-header";
import { card, heading, Tile } from "@/components/ui";
import { kes } from "@/lib/format";

type Invoice = {
  id: number; amountDue: number; amountPaid: number; status: "UNPAID" | "PARTIAL" | "PAID"; dueDate: string;
  term: { academicYear: string; termNumber: number };
};
type Payment = {
  id: number; amount: number; status: "PENDING" | "PAID" | "FAILED"; mpesaReceipt: string | null;
  failureReason: string | null; createdAt: string;
};
type Statement = { balance: number; invoices: Invoice[]; payments: Payment[] };

const day = (d: string) => new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
const STATUS = {
  PAID: ["Paid", "bg-[#DCF2E4] text-[#166534]"],
  PARTIAL: ["Part paid", "bg-[#FDE7D3] text-[#9A3412]"],
  UNPAID: ["Unpaid", "bg-[#F9E0E0] text-[#991B1B]"],
} as const;
const field = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C2410C]";

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

  async function pay(e: React.FormEvent) {
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

  const due = data ? data.invoices.reduce((s, i) => s + i.amountDue, 0) : 0;
  const paid = data ? due - data.balance : 0;
  const pct = due ? Math.round((paid / due) * 100) : 0;
  const demo = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <StudentHeader id={id} active="fees" />

      {!data ? (
        <p className="text-slate-600">{notice?.text ?? "Loading fee statement…"}</p>
      ) : (
        <>
          <section aria-label="Fee totals" className="grid gap-4 sm:grid-cols-3">
            <Tile label="Outstanding" tone={data.balance > 0 ? "rose" : "mint"} value={data.balance > 0 ? kes(data.balance) : "Cleared"} sub={data.balance > 0 ? "across all terms" : "Nothing to pay right now"} />
            <Tile label="Paid so far" tone="mint" value={kes(paid)} sub={`${pct}% of the fees billed`} />
            <Tile label="Billed" tone="sand" value={kes(due)} sub={`${data.invoices.length} term${data.invoices.length === 1 ? "" : "s"}`} />
          </section>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <section className={card}>
                <h2 className={heading}>Terms</h2>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200" role="img" aria-label={`${kes(paid)} paid of ${kes(due)}`}>
                  <div className="h-full rounded-full bg-[#0E8A4F]" style={{ width: `${pct}%` }} />
                </div>
                <ul className="mt-5 divide-y divide-slate-200">
                  {data.invoices.length === 0 && <li className="py-4 text-slate-600">No invoices yet. The school office generates them at the start of each term.</li>}
                  {data.invoices.map((i) => {
                    const [label, tone] = STATUS[i.status];
                    return (
                      <li key={i.id} className="py-4">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold">Term {i.term.termNumber}, {i.term.academicYear}</span>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>{label}</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                          <div className="h-full rounded-full bg-[#0E8A4F]" style={{ width: `${(i.amountPaid / i.amountDue) * 100}%` }} />
                        </div>
                        <p className="mt-1.5 text-sm text-slate-600">{kes(i.amountPaid)} of {kes(i.amountDue)}, due {day(i.dueDate)}</p>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section className={card}>
                <h2 className={heading}>Payments</h2>
                <ul className="mt-3 divide-y divide-slate-200">
                  {data.payments.length === 0 && <li className="py-4 text-slate-600">No payments yet.</li>}
                  {data.payments.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-4 py-3">
                      <span>
                        <span className="font-semibold">{kes(p.amount)}</span>
                        <span className="ml-2 text-sm text-slate-500">{day(p.createdAt)}</span>
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.status === "PAID" ? "bg-[#DCF2E4] text-[#166534]" : p.status === "PENDING" ? "bg-[#DDEBF8] text-[#1E40AF]" : "bg-[#F9E0E0] text-[#991B1B]"}`}>
                        {p.status === "PAID" ? `Receipt ${p.mpesaReceipt}` : p.status === "PENDING" ? "Waiting" : "Cancelled"}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <div className="space-y-6">
              {notice && (
                <p role="status" className={`rounded-xl px-4 py-3 ${notice.tone === "ok" ? "bg-[#DCF2E4] text-[#14532D]" : notice.tone === "error" ? "bg-[#F9E0E0] text-[#7F1D1D]" : "bg-[#DDEBF8] text-[#1E3A8A]"}`}>
                  {notice.text}
                </p>
              )}

              {data.balance > 0 && (
                <form onSubmit={pay} className={`${card} border-2 border-[#0E8A4F]`}>
                  <h2 className={heading}>Pay with M-Pesa</h2>
                  <label className="mt-4 block text-sm font-medium">M-Pesa phone number
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="0712 345 678" className={field} />
                  </label>
                  <label className="mt-3 block text-sm font-medium">Amount (KES)
                    <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" placeholder={String(data.balance)} className={field} />
                  </label>
                  <button disabled={!!pendingId} className="mt-4 min-h-11 w-full rounded-lg bg-[#0E8A4F] px-5 font-semibold text-white hover:bg-[#0B7541] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E8A4F]">
                    {pendingId ? "Waiting for M-Pesa…" : "Pay with M-Pesa"}
                  </button>

                  {pendingId && demo && (
                    <div className="mt-4 rounded-lg bg-slate-100 p-3 text-sm">
                      <p className="text-slate-600">Demo mode, stands in for the customer's phone:</p>
                      <div className="mt-2 flex gap-2">
                        <button type="button" onClick={() => simulate(true)} className="rounded border border-slate-400 bg-white px-3 py-1.5">Enter PIN</button>
                        <button type="button" onClick={() => simulate(false)} className="rounded border border-slate-400 bg-white px-3 py-1.5">Cancel</button>
                      </div>
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
