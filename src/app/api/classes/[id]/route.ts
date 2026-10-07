import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { bad } from "@/lib/http";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireRole("ADMIN");
  if (guard instanceof NextResponse) return guard;

  const { name, stream } = await req.json().catch(() => ({}));
  const data: { name?: string; stream?: string | null } = {};
  if (typeof name === "string" && name.trim()) data.name = name.trim();
  if (typeof stream === "string") data.stream = stream.trim() || null;

  const updated = await db.schoolClass.update({ where: { id: Number((await params).id) }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireRole("ADMIN");
  if (guard instanceof NextResponse) return guard;

  const id = Number((await params).id);
  const [students, feeItems] = await Promise.all([
    db.student.count({ where: { schoolClassId: id } }),
    db.feeStructure.count({ where: { schoolClassId: id } }),
  ]);
  if (students > 0) return bad("This class still has students. Move them to another class first.", 409);
  if (feeItems > 0) return bad("This class has fee items set up, so it can't be deleted.", 409);

  await db.schoolClass.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
