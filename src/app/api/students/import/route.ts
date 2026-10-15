import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { bad } from "@/lib/http";
import { parseCsv } from "@/lib/csv";
import { classLabel, readStudentRows } from "@/lib/student-csv";

const MAX_ROWS = 1000;

/**
 * POST { csv, dryRun }. A dry run only checks the file and reports what would happen.
 * A real run is all-or-nothing: if any row has a problem, nothing is imported.
 * Students are matched by admission number; the id column is ignored.
 */
export async function POST(req: Request) {
  const guard = await requireRole("ADMIN");
  if (guard instanceof NextResponse) return guard;

  const { csv, dryRun } = await req.json().catch(() => ({}));
  if (typeof csv !== "string" || !csv.trim()) return bad("Choose a CSV file first.");
  if (csv.length > 1_000_000) return bad("That file is too large. Split it into smaller files.");

  const table = parseCsv(csv);
  if (table.length - 1 > MAX_ROWS) return bad(`Import up to ${MAX_ROWS} students at a time.`);

  const classes = await db.schoolClass.findMany({ select: { id: true, name: true, stream: true } });
  const { rows, errors } = readStudentRows(table, classes);
  if (errors.length) {
    const grouped = new Map<string, number[]>();
    for (const e of errors) grouped.set(e.message, [...(grouped.get(e.message) ?? []), e.row]);
    return NextResponse.json({
      ok: false,
      totalErrors: errors.length,
      groups: [...grouped].slice(0, 30).map(([message, rows]) => ({ message, rows })),
      known: [...new Set(classes.map(classLabel))].sort(),
    });
  }

  const existing = await db.student.findMany({
    where: { admissionNo: { in: rows.map((r) => r.admissionNo) } },
    select: { id: true, admissionNo: true },
  });
  const byAdm = new Map(existing.map((s) => [s.admissionNo.toLowerCase(), s.id]));

  const creates = rows.filter((r) => !byAdm.has(r.admissionNo.toLowerCase()));
  const updates = rows.filter((r) => byAdm.has(r.admissionNo.toLowerCase()));
  const label = new Map(classes.map((c) => [c.id, classLabel(c)]));

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      created: creates.length,
      updated: updates.length,
      preview: rows.slice(0, 8).map((r) => ({
        admissionNo: r.admissionNo,
        name: `${r.firstName} ${r.lastName}`,
        gender: r.gender === "MALE" ? "Male" : r.gender === "FEMALE" ? "Female" : "",
        dob: r.dob ? r.dob.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "",
        class: label.get(r.classId),
        parent: r.guardianName ?? "",
        action: byAdm.has(r.admissionNo.toLowerCase()) ? "Update" : "New",
      })),
    });
  }

  await db.$transaction([
    db.student.createMany({
      data: creates.map((r) => ({
        admissionNo: r.admissionNo, firstName: r.firstName, lastName: r.lastName,
        schoolClassId: r.classId, gender: r.gender, dateOfBirth: r.dob, guardianName: r.guardianName,
      })),
    }),
    // On updates, a blank gender, date of birth or parent name leaves the saved value alone.
    ...updates.map((r) =>
      db.student.update({
        where: { id: byAdm.get(r.admissionNo.toLowerCase())! },
        data: {
          firstName: r.firstName, lastName: r.lastName, schoolClassId: r.classId,
          ...(r.gender ? { gender: r.gender } : {}), ...(r.dob ? { dateOfBirth: r.dob } : {}),
          ...(r.guardianName ? { guardianName: r.guardianName } : {}),
        },
      }),
    ),
  ]);

  return NextResponse.json({ ok: true, created: creates.length, updated: updates.length });
}
