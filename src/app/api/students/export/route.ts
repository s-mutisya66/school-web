import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { csvCell } from "@/lib/csv";
import { classLabel } from "@/lib/student-csv";

const HEADER = ["id", "Admission No.", "FName", "Lname", "Gender", "D.O.B", "Stream", "Parent Name", "Parent Phone", "Parent Email"];

const dmy = (d: Date | null) =>
  d ? `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}` : "";

export async function GET(req: Request) {
  const guard = await requireRole("ADMIN");
  if (guard instanceof NextResponse) return guard;

  const template = new URL(req.url).searchParams.has("template");
  const lines = [HEADER.map(csvCell).join(",")];

  if (template) {
    lines.push(["", "ADM-002", "Wanjiru", "Kamau", "Female", "14/03/2010", "Form 2 North", "Grace Kamau", "0712345678", "grace.kamau@example.com"].map(csvCell).join(","));
  } else {
    const students = await db.student.findMany({ include: { schoolClass: true, guardians: { select: { phone: true, email: true }, orderBy: { id: "asc" }, take: 1 } }, orderBy: { id: "asc" } });
    for (const s of students) {
      lines.push(
        [s.id, s.admissionNo, s.firstName, s.lastName, s.gender === "MALE" ? "Male" : s.gender === "FEMALE" ? "Female" : "", dmy(s.dateOfBirth), classLabel(s.schoolClass), s.guardianName ?? "", (s.guardianPhone ?? s.guardians[0]?.phone) ? "0" + (s.guardianPhone ?? s.guardians[0]?.phone ?? "").slice(3) : "", s.guardians[0]?.email ?? ""]
          .map(csvCell).join(","),
      );
    }
  }

  const day = new Date().toISOString().slice(0, 10);
  // The BOM makes Excel read the file as UTF-8, so names with accents survive.
  return new NextResponse("\uFEFF" + lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${template ? "students-template" : `students-${day}`}.csv"`,
    },
  });
}
