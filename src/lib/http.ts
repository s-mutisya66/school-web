import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export const bad = (error: string, status = 422) => NextResponse.json({ error }, { status });

export function uniqueError(e: unknown, message: string) {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return bad(message, 409);
  throw e;
}
