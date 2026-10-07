import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, requireRole } from "@/lib/auth";
import { bad, uniqueError } from "@/lib/http";

const select = { id: true, name: true, email: true, role: true, children: { select: { id: true, firstName: true, lastName: true } } };

export async function GET(req: Request) {
  const guard = await requireRole("ADMIN");
  if (guard instanceof NextResponse) return guard;

  const role = new URL(req.url).searchParams.get("role");
  const users = await db.user.findMany({
    where: role === "TEACHER" || role === "PARENT" ? { role } : {},
    select,
    orderBy: { name: "asc" },
  });
  return NextResponse.json(users);
}

// Admin accounts can't be created here on purpose; only TEACHER and PARENT.
export async function POST(req: Request) {
  const guard = await requireRole("ADMIN");
  if (guard instanceof NextResponse) return guard;

  const { name, email, role, password } = await req.json().catch(() => ({}));
  if (typeof name !== "string" || !name.trim()) return bad("Enter the person's name.");
  if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) return bad("Enter a valid email address.");
  if (role !== "TEACHER" && role !== "PARENT") return bad("Role must be Teacher or Parent.");
  if (typeof password !== "string" || password.length < 8) return bad("The temporary password needs at least 8 characters.");

  try {
    const user = await db.user.create({
      data: { name: name.trim(), email: email.toLowerCase().trim(), role, passwordHash: await hashPassword(password) },
      select,
    });
    return NextResponse.json(user, { status: 201 });
  } catch (e) {
    return uniqueError(e, "An account with that email already exists.");
  }
}
