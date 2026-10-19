import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashTempPassword, requireRole } from "@/lib/auth";
import { bad } from "@/lib/http";
import { generatePassword } from "@/lib/passwords";

/** Admin: sets a new random temporary password, which the user must change at next sign-in. */
export async function PUT(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireRole("ADMIN");
  if (guard instanceof NextResponse) return guard;

  const id = Number((await params).id);
  if (!(await db.user.findUnique({ where: { id }, select: { id: true } }))) return bad("User not found.", 404);

  const password = generatePassword();
  await db.user.update({ where: { id }, data: { passwordHash: await hashTempPassword(password), mustChangePassword: true } });
  return NextResponse.json({ password });
}
