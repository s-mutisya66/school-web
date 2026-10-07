import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { totalBalance } from "@/lib/fees";
import { canAccessStudent, forbidden, getSession, unauthorized } from "@/lib/auth";
import { normalisePhone, PHONE_REGEX, stkPush } from "@/lib/mpesa";

/** Parent taps "Pay with M-Pesa": creates a PENDING payment and fires the (fake) STK push. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const studentId = Number((await params).id);
  const session = await getSession();
  if (!session) return unauthorized();
  if (!(await canAccessStudent(session, studentId))) return forbidden();
  const body = await req.json().catch(() => ({}));
  const { phone, amount } = body as { phone?: string; amount?: number };

  const student = await db.student.findUnique({ where: { id: studentId } });
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  const balance = await totalBalance(studentId);
  if (balance <= 0) return NextResponse.json({ error: "No outstanding balance." }, { status: 422 });

  if (!phone || !PHONE_REGEX.test(phone)) {
    return NextResponse.json({ error: "Enter a valid Safaricom number." }, { status: 422 });
  }
  if (!Number.isInteger(amount) || amount! < 1 || amount! > balance) {
    return NextResponse.json({ error: `Amount must be a whole number between 1 and ${balance}.` }, { status: 422 });
  }

  const normalised = normalisePhone(phone);
  const stk = stkPush(normalised, amount!, student.admissionNo);

  const payment = await db.payment.create({
    data: {
      studentId,
      amount: amount!,
      phone: normalised,
      merchantRequestId: stk.MerchantRequestID,
      checkoutRequestId: stk.CheckoutRequestID,
    },
  });

  return NextResponse.json({ payment, message: stk.CustomerMessage }, { status: 201 });
}
