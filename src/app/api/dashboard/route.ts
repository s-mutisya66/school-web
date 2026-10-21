import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { forbidden, getSession, unauthorized } from "@/lib/auth";
import { buildAdminDashboard, buildTeacherDashboard } from "@/lib/dashboard";

/** The numbers behind the home page. Admins get the school overview, teachers get their own classes. */
export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();

  const user = await db.user.findUnique({ where: { id: session.userId }, select: { name: true, role: true } });
  if (!user) return unauthorized();

  if (user.role === "ADMIN") return NextResponse.json({ role: "ADMIN", name: user.name, ...(await buildAdminDashboard()) });
  if (user.role === "TEACHER") return NextResponse.json({ role: "TEACHER", name: user.name, ...(await buildTeacherDashboard(session.userId)) });
  return forbidden();
}
