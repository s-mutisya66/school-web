export type ClassOpt = { id: number; name: string; stream: string | null };
export type ParsedRow = {
  rowNumber: number; admissionNo: string; firstName: string; lastName: string;
  gender: "MALE" | "FEMALE" | null; dob: Date | null; classId: number; guardianName: string | null;
};
export type RowError = { row: number; message: string };

export const classLabel = (c: { name: string; stream: string | null }) => (c.stream ? `${c.name} ${c.stream}` : c.name);

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

const HEADER_NAMES: Record<string, string> = {
  id: "id", admissionno: "admissionNo", admissionnumber: "admissionNo", admno: "admissionNo",
  fname: "firstName", firstname: "firstName", lname: "lastName", lastname: "lastName", surname: "lastName",
  gender: "gender", sex: "gender", dob: "dob", dateofbirth: "dob", stream: "stream", class: "stream",
  parentname: "guardianName", parent: "guardianName", guardianname: "guardianName", guardian: "guardianName",
};

export function parseGender(raw: string): { value: "MALE" | "FEMALE" | null; error?: string } {
  const g = norm(raw);
  if (!g) return { value: null };
  if (["m", "male", "boy"].includes(g)) return { value: "MALE" };
  if (["f", "female", "girl"].includes(g)) return { value: "FEMALE" };
  return { value: null, error: `Gender "${raw.trim()}" isn't Male or Female.` };
}

/** Accepts 2010-03-14 or 14/03/2010 (day first; also - or . as separators). */
export function parseDob(raw: string, now = new Date()): { value: Date | null; error?: string } {
  const s = raw.trim();
  if (!s) return { value: null };

  let y: number, m: number, d: number;
  let match = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) [y, m, d] = [+match[1], +match[2], +match[3]];
  else if ((match = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/))) [d, m, y] = [+match[1], +match[2], +match[3]];
  else return { value: null, error: `Date of birth "${s}" isn't in a format I can read. Use 14/03/2010 or 2010-03-14.` };

  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return { value: null, error: `Date of birth "${s}" isn't a real date.` };
  }
  if (y < 1980 || date > now) return { value: null, error: `Date of birth "${s}" looks wrong.` };
  return { value: date };
}

/** Matches "Form 2 North", or a class name or stream that is unique on its own. */
export function matchClass(raw: string, classes: ClassOpt[]): { id?: number; error?: string } {
  const want = norm(raw);
  if (!want) return { error: "Stream is empty." };

  const full = classes.filter((c) => norm(classLabel(c)) === want);
  if (full.length === 1) return { id: full[0].id };
  if (full.length > 1) {
    return { error: `There are ${full.length} classes named "${classLabel(full[0])}". Delete the extra one under Classes on this page, then upload again.` };
  }

  for (const pick of [(c: ClassOpt) => c.name, (c: ClassOpt) => c.stream ?? ""]) {
    const hits = classes.filter((c) => norm(pick(c)) === want);
    if (hits.length === 1) return { id: hits[0].id };
    if (hits.length > 1) return { error: `"${raw.trim()}" matches more than one class. Write it in full, like "${classLabel(hits[0])}".` };
  }

  return { error: `Stream "${raw.trim()}" doesn't match a class.` };
}

export function readStudentRows(table: string[][], classes: ClassOpt[]): { rows: ParsedRow[]; errors: RowError[] } {
  const errors: RowError[] = [];
  const header = table[0];
  if (!header || header.every((h) => !h.trim())) return { rows: [], errors: [{ row: 1, message: "The file is empty." }] };

  const col: Record<string, number> = {};
  header.forEach((h, i) => {
    const key = HEADER_NAMES[h.toLowerCase().replace(/[^a-z]/g, "")];
    if (key && !(key in col)) col[key] = i;
  });
  const missing = (["admissionNo", "firstName", "lastName", "stream"] as const).filter((k) => !(k in col));
  if (missing.length) {
    const names = { admissionNo: "Admission No.", firstName: "FName", lastName: "Lname", stream: "Stream" };
    return { rows: [], errors: [{ row: 1, message: `Missing column: ${missing.map((k) => names[k]).join(", ")}.` }] };
  }

  const cell = (r: string[], key: string) => (key in col ? (r[col[key]] ?? "") : "");
  const rows: ParsedRow[] = [];
  const seen = new Map<string, number>();

  for (let i = 1; i < table.length; i++) {
    const r = table[i];
    // Rows holding only a pre-filled id number (as in a sheet with ids down column A) count as blank.
    if (r.every((x, j) => j === col.id || x.trim() === "")) continue;
    const rowNumber = i + 1; // matches the row number in Excel
    const problems: string[] = [];

    const admissionNo = cell(r, "admissionNo").trim();
    const firstName = cell(r, "firstName").trim();
    const lastName = cell(r, "lastName").trim();
    if (!admissionNo) problems.push("Admission No. is empty.");
    if (!firstName) problems.push("FName is empty.");
    if (!lastName) problems.push("Lname is empty.");
    if (admissionNo.length > 30 || firstName.length > 60 || lastName.length > 60) problems.push("A value is too long.");

    const guardianName = cell(r, "guardianName").trim();
    if (guardianName.length > 100) problems.push("Parent Name is too long.");

    const key = admissionNo.toLowerCase();
    if (admissionNo && seen.has(key)) problems.push(`Admission No. ${admissionNo} is already used on row ${seen.get(key)}.`);
    else if (admissionNo) seen.set(key, rowNumber);

    const g = parseGender(cell(r, "gender"));
    const d = parseDob(cell(r, "dob"));
    const c = matchClass(cell(r, "stream"), classes);
    if (g.error) problems.push(g.error);
    if (d.error) problems.push(d.error);
    if (c.error) problems.push(c.error);

    if (problems.length) problems.forEach((message) => errors.push({ row: rowNumber, message }));
    else rows.push({ rowNumber, admissionNo, firstName, lastName, gender: g.value, dob: d.value, classId: c.id!, guardianName: guardianName || null });
  }

  if (rows.length === 0 && errors.length === 0) errors.push({ row: 2, message: "There are no student rows in the file." });
  return { rows, errors };
}
