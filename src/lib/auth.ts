import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import { db } from "./db";

const COOKIE = "session";
const key = () => new TextEncoder().encode(process.env.AUTH_SECRET);

export type Session = { userId: number; role: Role };

export const hashPassword = (p: string) => bcrypt.hash(p, 10);
export const checkPassword = (p: string, hash: string) => bcrypt.compare(p, hash);

export async function startSession(user: { id: number; role: Role }) {
  const token = await new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setExpirationTime("7d")
    .sign(key());

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return { userId: Number(payload.sub), role: payload.role as Role };
  } catch {
    return null;
  }
}

export const unauthorized = () => NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
export const forbidden = () => NextResponse.json({ error: "You don't have access to this." }, { status: 403 });

/** Admins see every student; parents only their own children; teachers have no fee access. */
export async function canAccessStudent(s: Session, studentId: number): Promise<boolean> {
  if (s.role === "ADMIN") return true;
  if (s.role !== "PARENT") return false;
  const match = await db.student.findFirst({
    where: { id: studentId, guardians: { some: { id: s.userId } } },
    select: { id: true },
  });
  return !!match;
}

/** Returns the session if the user has one of the roles, otherwise a ready-made 401/403 response. */
export async function requireRole(...roles: Role[]): Promise<Session | NextResponse> {
  const s = await getSession();
  if (!s) return unauthorized();
  return roles.includes(s.role) ? s : forbidden();
}

/** The ids of the classes a teacher has any assignment in. */
export async function teacherClassIds(userId: number): Promise<number[]> {
  const rows = await db.teachingAssignment.findMany({ where: { teacherId: userId }, select: { schoolClassId: true }, distinct: ["schoolClassId"] });
  return rows.map((r) => r.schoolClassId);
}

/** Admins can use any class; teachers only the classes they're assigned to. */
export async function canAccessClass(s: Session, classId: number): Promise<boolean> {
  if (s.role === "ADMIN") return true;
  if (s.role !== "TEACHER") return false;
  return (await db.teachingAssignment.count({ where: { teacherId: s.userId, schoolClassId: classId } })) > 0;
}

/** The subjects someone may enter marks for in a class: every subject, or a list of subject ids. */
export async function markableSubjects(s: Session, classId: number): Promise<"all" | number[]> {
  if (s.role === "ADMIN") return "all";
  if (s.role !== "TEACHER") return [];
  const rows = await db.teachingAssignment.findMany({ where: { teacherId: s.userId, schoolClassId: classId }, select: { subjectId: true } });
  if (rows.some((r) => r.subjectId === null)) return "all";
  return rows.map((r) => r.subjectId as number);
}

export async function canMarkSubject(s: Session, classId: number, subjectId: number): Promise<boolean> {
  const allowed = await markableSubjects(s, classId);
  return allowed === "all" || allowed.includes(subjectId);
}
