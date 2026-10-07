import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateInvoices } from "../src/lib/fees";

const db = new PrismaClient();

// Demo data only. Never ship these passwords.
async function main() {
  const cls = await db.schoolClass.create({ data: { name: "Form 2", stream: "North" } });

  const terms = await Promise.all([
    db.term.create({ data: { academicYear: "2026", termNumber: 1, startsOn: new Date("2026-01-05"), endsOn: new Date("2026-04-03"), feesDueOn: new Date("2026-01-19") } }),
    db.term.create({ data: { academicYear: "2026", termNumber: 2, startsOn: new Date("2026-05-04"), endsOn: new Date("2026-08-07"), feesDueOn: new Date("2026-05-18") } }),
    db.term.create({ data: { academicYear: "2026", termNumber: 3, startsOn: new Date("2026-08-31"), endsOn: new Date("2026-11-20"), feesDueOn: new Date("2026-09-14"), isCurrent: true } }),
  ]);

  for (const t of terms) {
    await db.feeStructure.createMany({
      data: [
        { schoolClassId: cls.id, termId: t.id, item: "Tuition", amount: 25000 },
        { schoolClassId: cls.id, termId: t.id, item: "Activities", amount: 3000 },
      ],
    });
  }

  await db.user.create({
    data: { email: "admin@school.test", name: "School Admin", role: "ADMIN", passwordHash: await bcrypt.hash("prince@24", 10) },
  });

  await db.user.create({
    data: {
      email: "parent@school.test", name: "Demo Parent", role: "PARENT",
      passwordHash: await bcrypt.hash("parent123", 10),
      children: { create: [{ admissionNo: "ADM-001", firstName: "Amani", lastName: "Otieno", schoolClassId: cls.id }] },
    },
  });

  for (const t of terms) await generateInvoices(t.id);
  console.log("Seeded. admin@school.test / prince@24, parent@school.test / parent123");
}

main().finally(() => db.$disconnect());
