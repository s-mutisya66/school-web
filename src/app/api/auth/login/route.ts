import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkPassword, startSession } from "@/lib/auth";

// TODO: add rate limiting before this goes anywhere public.
export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));

  const user =
    typeof email === "string"
      ? await db.user.findUnique({
          where: { email: email.toLowerCase().trim() },
          include: { children: { select: { id: true }, take: 1 } },
        })
      : null;

  // Same message for unknown email and wrong password.
  if (!user || typeof password !== "string" || !(await checkPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Wrong email or password." }, { status: 401 });
  }

  await startSession(user);

  const redirect =
    user.role === "ADMIN" ? "/admin/fees"
    : user.role === "TEACHER" ? "/admin/attendance"
    : user.role === "PARENT" && user.children[0] ? `/students/${user.children[0].id}/fees`
    : "/login";

  return NextResponse.json({ redirect });
}
