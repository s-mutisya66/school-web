import { NextResponse } from "next/server";
import { generateInvoices } from "@/lib/fees";
import { forbidden, getSession, unauthorized } from "@/lib/auth";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (session.role !== "ADMIN") return forbidden();

  const created = await generateInvoices(Number((await params).id));
  return NextResponse.json({ invoicesCreated: created });
}
