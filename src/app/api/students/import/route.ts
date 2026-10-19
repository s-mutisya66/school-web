import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashTempPassword, requireRole } from "@/lib/auth";
import { bad } from "@/lib/http";
import { parseCsv } from "@/lib/csv";
import { generatePassword } from "@/lib/passwords";
import { classLabel, readStudentRows, type ParsedRow, type RowError } from "@/lib/student-csv";

export const maxDuration = 60;

const MAX_ROWS = 1000;
const MAX_NEW_LOGINS = 400;
const local = (p: string) => "0" + p.slice(3); // 0712345678
const pretty = (p: string) => `0${p.slice(3, 6)} ${p.slice(6, 9)} ${p.slice(9)}`;

/** A parent login is identified by email when the row has one, otherwise by phone. */
const keyOf = (r: ParsedRow) => (r.email ? `e:${r.email}` : r.phone ? `p:${r.phone}` : null);
const labelOf = (key: string) => (key.startsWith("e:") ? key.slice(2) : pretty(key.slice(2)));

function problems(errors: RowError[], known: string[]) {
  const grouped = new Map<string, number[]>();
  for (const e of errors) grouped.set(e.message, [...(grouped.get(e.message) ?? []), e.row]);
  return NextResponse.json({
    ok: false,
    totalErrors: errors.length,
    groups: [...grouped].slice(0, 30).map(([message, rows]) => ({ message, rows })),
    known,
  });
}

/**
 * POST { csv, dryRun }. A dry run only checks the file and reports what would happen.
 * A real run is all-or-nothing: if any row has a problem, nothing is imported.
 * Students are matched by admission number; the id column is ignored.
 *
 * Parent logins:
 *  - Parent Email present: the email is the login. A new account's first password is the parent's
 *    phone number (written 0712345678), or a random one if the row has no phone.
 *  - Phone only: the phone is the login, with a random first password.
 *  - Rows sharing an email (or phone) are linked to the same parent. Existing accounts are only linked,
 *    never changed. Every new account must choose a new password at first sign-in.
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
  const known = [...new Set(classes.map(classLabel))].sort();
  const { rows, errors } = readStudentRows(table, classes);

  // Which logins already exist, and are they parents'?
  const emails = [...new Set(rows.map((r) => r.email).filter((e): e is string => !!e))];
  const phoneOnly = [...new Set(rows.filter((r) => !r.email && r.phone).map((r) => r.phone!))];
  const [emailOwners, phoneOwners] = await Promise.all([
    emails.length ? db.user.findMany({ where: { email: { in: emails } }, select: { id: true, email: true, role: true } }) : [],
    phoneOnly.length ? db.user.findMany({ where: { phone: { in: phoneOnly } }, select: { id: true, phone: true, role: true } }) : [],
  ]);
  const ownerOf = new Map<string, string>([
    ...emailOwners.map((o) => [`e:${o.email}`, o.role] as [string, string]),
    ...phoneOwners.map((o) => [`p:${o.phone}`, o.role] as [string, string]),
  ]);

  for (const r of rows) {
    const k = keyOf(r);
    const role = k ? ownerOf.get(k) : undefined;
    if (k && role && role !== "PARENT") {
      errors.push({ row: r.rowNumber, message: `${labelOf(k)} already belongs to a ${role.toLowerCase()} account, so it can't be used as a parent login.` });
    }
  }
  if (errors.length) return problems(errors.sort((a, b) => a.row - b.row), known);

  const allKeys = [...new Set(rows.map(keyOf).filter((k): k is string => !!k))];
  const newKeys = allKeys.filter((k) => !ownerOf.has(k));
  if (newKeys.length > MAX_NEW_LOGINS) return bad(`This file would create ${newKeys.length} parent logins. Import at most ${MAX_NEW_LOGINS} new parents at a time.`);

  const existing = await db.student.findMany({ where: { admissionNo: { in: rows.map((r) => r.admissionNo) } }, select: { id: true, admissionNo: true } });
  const byAdm = new Map(existing.map((s) => [s.admissionNo.toLowerCase(), s.id]));
  const creates = rows.filter((r) => !byAdm.has(r.admissionNo.toLowerCase()));
  const updates = rows.filter((r) => byAdm.has(r.admissionNo.toLowerCase()));
  const label = new Map(classes.map((c) => [c.id, classLabel(c)]));

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      created: creates.length,
      updated: updates.length,
      newLogins: newKeys.length,
      linkedLogins: allKeys.length - newKeys.length,
      preview: rows.slice(0, 8).map((r) => {
        const k = keyOf(r);
        return {
          admissionNo: r.admissionNo,
          name: `${r.firstName} ${r.lastName}`,
          gender: r.gender === "MALE" ? "Male" : r.gender === "FEMALE" ? "Female" : "",
          dob: r.dob ? r.dob.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "",
          class: label.get(r.classId),
          parent: r.guardianName ?? "",
          loginName: k ? labelOf(k) : "",
          login: !k ? "" : ownerOf.has(k) ? "Existing" : "New",
          action: byAdm.has(r.admissionNo.toLowerCase()) ? "Update" : "New",
        };
      }),
    });
  }

  // New parent logins, hashed before the database transaction starts.
  const newParents = await Promise.all(
    newKeys.map(async (key) => {
      const mine = rows.filter((r) => keyOf(r) === key);
      const byEmail = key.startsWith("e:");
      const phoneForPassword = byEmail ? mine.find((r) => r.phone)?.phone ?? null : null;
      const password = phoneForPassword ? local(phoneForPassword) : generatePassword();
      return {
        email: byEmail ? key.slice(2) : null,
        phone: byEmail ? null : key.slice(2),
        name: mine.find((r) => r.guardianName)?.guardianName ?? `Parent of ${mine[0].firstName} ${mine[0].lastName}`,
        login: labelOf(key),
        password,
        hash: await hashTempPassword(password),
        children: mine.map((r) => `${r.firstName} ${r.lastName}`).join(", "),
      };
    }),
  );

  try {
    await db.$transaction(
      async (tx) => {
        if (newParents.length) {
          await tx.user.createMany({
            data: newParents.map((p) => ({ name: p.name, email: p.email, phone: p.phone, role: "PARENT" as const, passwordHash: p.hash, mustChangePassword: true })),
          });
        }
        if (creates.length) {
          await tx.student.createMany({
            data: creates.map((r) => ({
              admissionNo: r.admissionNo, firstName: r.firstName, lastName: r.lastName, schoolClassId: r.classId,
              gender: r.gender, dateOfBirth: r.dob, guardianName: r.guardianName, guardianPhone: r.phone,
            })),
          });
        }
        // On updates, a blank gender, date of birth, parent name or phone leaves the saved value alone.
        for (const r of updates) {
          await tx.student.update({
            where: { id: byAdm.get(r.admissionNo.toLowerCase())! },
            data: {
              firstName: r.firstName, lastName: r.lastName, schoolClassId: r.classId,
              ...(r.gender ? { gender: r.gender } : {}), ...(r.dob ? { dateOfBirth: r.dob } : {}),
              ...(r.guardianName ? { guardianName: r.guardianName } : {}), ...(r.phone ? { guardianPhone: r.phone } : {}),
            },
          });
        }

        // Link each parent login to its students, skipping links that already exist.
        const withLogin = rows.filter((r) => keyOf(r));
        if (withLogin.length) {
          const parents = await tx.user.findMany({
            where: { role: "PARENT", OR: [{ email: { in: emails } }, { phone: { in: phoneOnly } }] },
            select: { id: true, email: true, phone: true },
          });
          const parentByKey = new Map<string, number>();
          for (const p of parents) {
            if (p.email) parentByKey.set(`e:${p.email}`, p.id);
            if (p.phone) parentByKey.set(`p:${p.phone}`, p.id);
          }
          const students = await tx.student.findMany({
            where: { admissionNo: { in: withLogin.map((r) => r.admissionNo) } },
            select: { id: true, admissionNo: true, guardians: { select: { id: true } } },
          });
          const studentByAdm = new Map(students.map((s) => [s.admissionNo.toLowerCase(), s]));

          const toLink = new Map<number, Set<number>>();
          for (const r of withLogin) {
            const parentId = parentByKey.get(keyOf(r)!)!;
            const student = studentByAdm.get(r.admissionNo.toLowerCase())!;
            if (student.guardians.some((g) => g.id === parentId)) continue;
            toLink.set(parentId, (toLink.get(parentId) ?? new Set()).add(student.id));
          }
          for (const [parentId, ids] of toLink) {
            await tx.user.update({ where: { id: parentId }, data: { children: { connect: [...ids].map((id) => ({ id })) } } });
          }
        }
      },
      { timeout: 55_000, maxWait: 10_000 },
    );
  } catch (e) {
    console.error("Student import failed:", e);
    return NextResponse.json({ error: "The import couldn't be saved, so nothing was changed. Please try again." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    created: creates.length,
    updated: updates.length,
    newLogins: newParents.length,
    // Random passwords are only ever shown here; they are stored as hashes and can't be looked up later.
    credentials: newParents.map((p) => ({ name: p.name, login: p.login, password: p.password, children: p.children })),
  });
}
