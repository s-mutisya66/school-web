import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkPassword, getSession, hashPassword, passwordAttempt, startSession, unauthorized } from "@/lib/auth";
import { homePathFor } from "@/lib/home";
import { bad } from "@/lib/http";

const needsChildCheck = (u: { mustChangePassword: boolean; role: string; children: unknown[] }) =>
  u.mustChangePassword && u.role === "PARENT" && u.children.length > 0;

/** Tells the password page whether this is a forced first change and what to ask for. */
export async function GET() {
  const session = await getSession({ allowPending: true });
  if (!session) return unauthorized();
  const user = await db.user.findUnique({ where: { id: session.userId }, include: { children: { select: { id: true } } } });
  if (!user) return unauthorized();
  return NextResponse.json({ mustChange: user.mustChangePassword, needsAdmission: needsChildCheck(user) });
}

/**
 * Lets a signed-in user choose a new password. A parent still on their first password must also
 * give one of their children's admission numbers, so someone who only knows the email and phone
 * number can't take over the account.
 */
export async function POST(req: Request) {
  const session = await getSession({ allowPending: true });
  if (!session) return unauthorized();

  const { current, next, admissionNo } = await req.json().catch(() => ({}));
  if (typeof current !== "string" || typeof next !== "string") return bad("Enter your current and new password.");
  if (next.length < 8) return bad("Your new password needs at least 8 characters.");

  const user = await db.user.findUnique({ where: { id: session.userId }, include: { children: { select: { id: true, admissionNo: true } } } });
  if (!user || !(await checkPassword(passwordAttempt(current, user.mustChangePassword), user.passwordHash))) return bad("Your current password isn't right.", 403);
  if (next === current || next === passwordAttempt(current, user.mustChangePassword)) return bad("Choose a password different from your current one.");

  if (needsChildCheck(user)) {
    const given = typeof admissionNo === "string" ? admissionNo.trim().toLowerCase() : "";
    if (!given || !user.children.some((c) => c.admissionNo.toLowerCase() === given)) {
      return bad("That isn't one of your children's admission numbers. You can find it on a fee statement or school ID.", 403);
    }
  }

  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(next), mustChangePassword: false } });
  await startSession({ id: user.id, role: user.role, mustChangePassword: false }); // replaces the restricted session
  return NextResponse.json({ redirect: homePathFor(user) });
}
