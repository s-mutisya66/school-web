import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, unauthorized } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();
  const user = await db.user.findUnique({ where: { id: session.userId }, select: { name: true, role: true } });
  if (!user) return unauthorized();
  return NextResponse.json(user);
}
