import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, requireRole } from "@/lib/auth";
import { bad, uniqueError } from "@/lib/http";
import { normalisePhone, PHONE_REGEX } from "@/lib/mpesa";

const select = {
  id: true, name: true, email: true, phone: true, role: true,
  children: { select: { id: true, firstName: true, lastName: true } },
  assignments: {
    select: {
      id: true, schoolClassId: true, subjectId: true,
      schoolClass: { select: { id: true, name: true, stream: true } },
      subject: { select: { id: true, name: true } },
    },
  },
};

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

  const { name, email, phone, role, password } = await req.json().catch(() => ({}));
  const cleanEmail = typeof email === "string" && email.trim() ? email.trim().toLowerCase() : null;
  const compactPhone = typeof phone === "string" ? phone.replace(/[\s-]/g, "") : "";

  if (typeof name !== "string" || !name.trim()) return bad("Enter the person's name.");
  if (!cleanEmail && !compactPhone) return bad("Enter an email address or a phone number.");
  if (cleanEmail && !/^\S+@\S+\.\S+$/.test(cleanEmail)) return bad("Enter a valid email address.");
  if (compactPhone && !PHONE_REGEX.test(compactPhone)) return bad("Enter a valid Kenyan mobile number, like 0712 345 678.");
  if (role !== "TEACHER" && role !== "PARENT") return bad("Role must be Teacher or Parent.");
  if (typeof password !== "string" || password.length < 8) return bad("The temporary password needs at least 8 characters.");

  try {
    const user = await db.user.create({
      data: {
        name: name.trim(), email: cleanEmail, phone: compactPhone ? normalisePhone(compactPhone) : null,
        role, passwordHash: await hashPassword(password),
      },
      select,
    });
    return NextResponse.json(user, { status: 201 });
  } catch (e) {
    return uniqueError(e, "An account with that email or phone number already exists.");
  }
}
