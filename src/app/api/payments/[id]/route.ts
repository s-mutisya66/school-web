import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canAccessStudent, forbidden, getSession, unauthorized } from "@/lib/auth";

// Polled by the fee statement page while an M-Pesa payment is pending.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return unauthorized();

  const payment = await db.payment.findUnique({ where: { id: Number((await params).id) } });
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  if (!(await canAccessStudent(session, payment.studentId))) return forbidden();

  return NextResponse.json(payment);
}
