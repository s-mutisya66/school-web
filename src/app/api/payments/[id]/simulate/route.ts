import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canAccessStudent, forbidden, getSession, unauthorized } from "@/lib/auth";
import { processCallback } from "@/lib/fees";
import { buildCallback } from "@/lib/mpesa";

/** Dev only: plays the part of the customer entering (or cancelling) their PIN. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
    return new NextResponse(null, { status: 404 });
  }

  const id = Number((await params).id);
  const { success = true } = await req.json().catch(() => ({}));

  const payment = await db.payment.findUnique({ where: { id } });
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

  const session = await getSession();
  if (!session) return unauthorized();
  if (!(await canAccessStudent(session, payment.studentId))) return forbidden();

  const result = await processCallback(buildCallback(payment, Boolean(success)));
  return NextResponse.json(result);
}
