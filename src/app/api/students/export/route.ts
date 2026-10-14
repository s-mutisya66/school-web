import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { csvCell } from "@/lib/csv";
import { classLabel } from "@/lib/student-csv";

const HEADER = ["id", "Admission No.", "FName", "Lname", "Gender", "D.O.B", "Stream"];

const dmy = (d: Date | null) =>
  d ? `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}` : "";

export async function GET(req: Request) {
  const guard = await requireRole("ADMIN");
  if (guard instanceof NextResponse) return guard;

  const template = new URL(req.url).searchParams.has("template");
  const lines = [HEADER.map(csvCell).join(",")];

  if (template) {
    lines.push(["", "ADM-002", "Wanjiru", "Kamau", "Female", "14/03/2010", "Form 2 North"].map(csvCell).join(","));
  } else {
    const students = await db.student.findMany({ include: { schoolClass: true }, orderBy: { id: "asc" } });
    for (const s of students) {
      lines.push(
        [s.id, s.admissionNo, s.firstName, s.lastName, s.gender === "MALE" ? "Male" : s.gender === "FEMALE" ? "Female" : "", dmy(s.dateOfBirth), classLabel(s.schoolClass)]
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
