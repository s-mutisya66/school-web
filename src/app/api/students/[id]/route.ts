import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { bad, uniqueError } from "@/lib/http";
import { resolveGuardians } from "@/lib/guardians";

// Students are deactivated, never deleted, so invoices and payment history stay intact.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireRole("ADMIN");
  if (guard instanceof NextResponse) return guard;

  const b = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  for (const k of ["admissionNo", "firstName", "lastName"]) {
    if (typeof b[k] === "string" && b[k].trim()) data[k] = b[k].trim();
  }
  if (Number(b.schoolClassId)) data.schoolClassId = Number(b.schoolClassId);
  if (b.status === "active" || b.status === "inactive") data.status = b.status;

  const g = await resolveGuardians(b.guardianEmails);
  if ("error" in g) return bad(g.error!);
  if (g.ids) data.guardians = { set: g.ids };

  try {
    const updated = await db.student.update({
      where: { id: Number((await params).id) },
      data,
      include: { schoolClass: true, guardians: { select: { id: true, name: true, email: true } } },
    });
    return NextResponse.json(updated);
  } catch (e) {
    return uniqueError(e, "That admission number is already in use.");
  }
}
