import { db } from "./db";
import { normalisePhone, PHONE_REGEX } from "./mpesa";

const local = (p: string) => "0" + p.slice(3);

/** Resolves parent logins from emails or phone numbers. Returns an error message if any are unknown. */
export async function resolveGuardians(entries: unknown) {
  if (entries === undefined) return { ids: undefined as { id: number }[] | undefined };
  if (!Array.isArray(entries)) return { error: "Parent logins must be a list." };

  const emails: string[] = [], phones: string[] = [], invalid: string[] = [];
  for (const raw of entries.map((e) => String(e).trim()).filter(Boolean)) {
    if (raw.includes("@")) emails.push(raw.toLowerCase());
    else {
      const compact = raw.replace(/[\s-]/g, "");
      if (PHONE_REGEX.test(compact)) phones.push(normalisePhone(compact)); else invalid.push(raw);
    }
  }
  if (invalid.length) return { error: `${invalid.join(", ")} isn't a valid email address or Kenyan phone number.` };

  const found = await db.user.findMany({
    where: { role: "PARENT", OR: [{ email: { in: emails } }, { phone: { in: phones } }] },
    select: { id: true, email: true, phone: true },
  });
  const missing = [
    ...emails.filter((e) => !found.some((u) => u.email === e)),
    ...phones.filter((p) => !found.some((u) => u.phone === p)).map(local),
  ];
  if (missing.length) return { error: `No parent account for: ${missing.join(", ")}. Create the parent under Users first.` };

  return { ids: found.map((u) => ({ id: u.id })) };
}
