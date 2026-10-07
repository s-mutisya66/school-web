import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export const bad = (error: string, status = 422) => NextResponse.json({ error }, { status });

/** Turns Prisma's unique-constraint error into a readable 409. */
export function uniqueError(e: unknown, message: string) {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return bad(message, 409);
  throw e;
}
