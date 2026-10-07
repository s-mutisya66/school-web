import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { totalBalance } from "@/lib/fees";
import { canAccessStudent, forbidden, getSession, unauthorized } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const studentId = Number((await params).id);
  const session = await getSession();
  if (!session) return unauthorized();
  if (!(await canAccessStudent(session, studentId))) return forbidden();

  const [invoices, payments, balance] = await Promise.all([
    db.invoice.findMany({ where: { studentId }, include: { term: true }, orderBy: { term: { startsOn: "asc" } } }),
    db.payment.findMany({ where: { studentId }, orderBy: { createdAt: "desc" }, take: 20 }),
    totalBalance(studentId),
  ]);

  return NextResponse.json({ balance, invoices, payments });
}
