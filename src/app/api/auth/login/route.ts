import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkPassword, passwordAttempt, startSession } from "@/lib/auth";
import { homePathFor } from "@/lib/home";
import { normalisePhone, PHONE_REGEX } from "@/lib/mpesa";

// TODO: add rate limiting before this goes anywhere public.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const raw = String(body.identifier ?? body.email ?? "").trim();
    const password = body.password;

    // Parents can sign in with their phone number, everyone else with an email.
    const compact = raw.replace(/[\s-]/g, "");
    const where = raw.includes("@") ? { email: raw.toLowerCase() } : PHONE_REGEX.test(compact) ? { phone: normalisePhone(compact) } : null;
    const user = where ? await db.user.findFirst({ where, include: { children: { select: { id: true }, take: 2 } } }) : null;

    // Same message for an unknown account and a wrong password.
    if (!user || typeof password !== "string" || !(await checkPassword(passwordAttempt(password, user.mustChangePassword), user.passwordHash))) {
      return NextResponse.json({ error: "Wrong email, phone number or password." }, { status: 401 });
    }

    await startSession(user);
    return NextResponse.json({ redirect: user.mustChangePassword ? "/account/password" : homePathFor(user) });
  } catch (e) {
    console.error("Login failed:", e);
    return NextResponse.json({ error: "The server couldn't reach the database. Wait a few seconds and try again." }, { status: 503 });
  }
}
