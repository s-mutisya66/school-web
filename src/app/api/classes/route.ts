import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { bad } from "@/lib/http";

export async function GET() {
  const guard = await requireRole("ADMIN", "TEACHER");
  if (guard instanceof NextResponse) return guard;

  const classes = await db.schoolClass.findMany({
    include: { _count: { select: { students: true } } },
    orderBy: [{ name: "asc" }, { stream: "asc" }],
  });
  return NextResponse.json(classes);
}

export async function POST(req: Request) {
  const guard = await requireRole("ADMIN");
  if (guard instanceof NextResponse) return guard;

  const { name, stream } = await req.json().catch(() => ({}));
  if (typeof name !== "string" || !name.trim()) return bad("Enter a class name, for example Form 2.");

  const created = await db.schoolClass.create({
    data: { name: name.trim(), stream: typeof stream === "string" && stream.trim() ? stream.trim() : null },
  });
  return NextResponse.json(created, { status: 201 });
}
