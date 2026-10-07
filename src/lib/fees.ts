import { Prisma } from "@prisma/client";
import { db } from "./db";
import type { StkCallbackPayload } from "./mpesa";

type Tx = Prisma.TransactionClient;

/** One invoice per active student for the term. Safe to re-run (skips existing). */
export async function generateInvoices(termId: number): Promise<number> {
  const term = await db.term.findUniqueOrThrow({ where: { id: termId } });

  const totals = await db.feeStructure.groupBy({
    by: ["schoolClassId"],
    where: { termId },
    _sum: { amount: true },
  });

  let created = 0;
  for (const t of totals) {
    const total = t._sum.amount ?? 0;
    if (total <= 0) continue;

    const students = await db.student.findMany({
      where: { schoolClassId: t.schoolClassId, status: "active" },
      select: { id: true },
    });

    const res = await db.invoice.createMany({
      data: students.map((s) => ({ studentId: s.id, termId, amountDue: total, dueDate: term.feesDueOn })),
      skipDuplicates: true,
    });
    created += res.count;
  }
  return created;
}

export async function totalBalance(studentId: number, client: Tx | typeof db = db): Promise<number> {
  const agg = await client.invoice.aggregate({
    where: { studentId },
    _sum: { amountDue: true, amountPaid: true },
  });
  return (agg._sum.amountDue ?? 0) - (agg._sum.amountPaid ?? 0);
}

/** Applies a paid amount to the oldest outstanding invoices first. */
async function allocate(tx: Tx, studentId: number, amount: number) {
  let remaining = amount;

  const invoices = await tx.invoice.findMany({
    where: { studentId, status: { not: "PAID" } },
    orderBy: { term: { startsOn: "asc" } },
  });

  for (const inv of invoices) {
    if (remaining <= 0) break;
    const apply = Math.min(remaining, inv.amountDue - inv.amountPaid);
    const paid = inv.amountPaid + apply;
    await tx.invoice.update({
      where: { id: inv.id },
      data: { amountPaid: paid, status: paid >= inv.amountDue ? "PAID" : "PARTIAL" },
    });
    remaining -= apply;
  }
}

/**
 * Handles an M-Pesa callback payload. Idempotent: the PENDING -> final status
 * flip is a single conditional UPDATE, so a replayed callback credits nothing.
 */
export async function processCallback(payload: StkCallbackPayload) {
  const cb = payload?.Body?.stkCallback;
  if (!cb) return null;

  return db.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { checkoutRequestId: cb.CheckoutRequestID } });
    if (!payment) return null;

    const success = cb.ResultCode === 0;
    const meta = Object.fromEntries((cb.CallbackMetadata?.Item ?? []).map((i) => [i.Name, i.Value]));

    const claimed = await tx.payment.updateMany({
      where: { id: payment.id, status: "PENDING" },
      data: success
        ? { status: "PAID", mpesaReceipt: String(meta.MpesaReceiptNumber ?? ""), paidAt: new Date() }
        : { status: "FAILED", failureReason: cb.ResultDesc },
    });

    if (claimed.count === 1 && success) {
      await allocate(tx, payment.studentId, payment.amount);
    }

    return tx.payment.findUnique({ where: { id: payment.id } });
  });
}
