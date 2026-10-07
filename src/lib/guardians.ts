import { db } from "./db";

/** Resolves parent emails to PARENT users. Returns an error message if any are unknown. */
export async function resolveGuardians(emails: unknown) {
  if (emails === undefined) return { ids: undefined as { id: number }[] | undefined };
  if (!Array.isArray(emails)) return { error: "Parent emails must be a list." };

  const wanted = emails.map((e) => String(e).toLowerCase().trim()).filter(Boolean);
  const found = await db.user.findMany({ where: { email: { in: wanted }, role: "PARENT" }, select: { id: true, email: true } });
  const missing = wanted.filter((e) => !found.some((u) => u.email === e));
  if (missing.length) return { error: `No parent account for: ${missing.join(", ")}. Create the parent under Users first.` };

  return { ids: found.map((u) => ({ id: u.id })) };
}
