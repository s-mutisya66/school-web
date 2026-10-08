# School management system

A school fee and attendance system built around how Kenyan schools work: termly fees and M-Pesa payments, with separate logins for admins, teachers and parents. It's a portfolio project, so all data is fictional and **M-Pesa is simulated**.

**Live demo:** _schoolweb-snerd.vercel.app_ · Demo logins are on the home page.

## Features

- **Term fees:** itemised fee structures per class and term, one invoice per student per term, and payments applied to the oldest unpaid term first.
- **Simulated M-Pesa (STK Push):** request and callback payloads follow Safaricom's Daraja format, so only one file (`src/lib/mpesa.ts`) changes for a real integration.
- **Roles:** admin, teacher and parent. Access is enforced in every API route, and a parent can only see their own children.
- **Attendance:** daily class registers (present, late, absent, excused) and a parent view with an attendance rate.
- **Admin tools:** manage classes, students, parent links and user accounts, and generate a term's invoices.

## Design decisions

- **Money is stored as whole shillings (integers),** matching M-Pesa and avoiding floating-point rounding.
- **Callbacks are idempotent.** The pending-to-paid change is one conditional update, so a replayed callback can't credit a payment twice.
- **Students are deactivated, never deleted,** so invoice and payment history is kept.
- **Sessions** are signed `httpOnly` cookies (`jose`); passwords are hashed with bcrypt.

## Tech

Next.js (App Router, TypeScript, Tailwind) · Prisma 6 · PostgreSQL on Neon · Vercel

## Screenshots

| Parent fee statement | Teacher attendance | Admin students |
|---|---|---|
| ![Fee statement](docs/screenshots/fees.png) | ![Attendance](docs/screenshots/attendance.png) | ![Students](docs/screenshots/students.png) |

## Run it locally

```bash
npm install
cp .env.example .env     # fill in DATABASE_URL, DIRECT_URL, AUTH_SECRET
npx prisma migrate dev
npx prisma db seed
npm run dev
```

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Pooled Postgres connection (used by the app) |
| `DIRECT_URL` | Direct Postgres connection (used by migrations) |
| `AUTH_SECRET` | Random string that signs session cookies |
| `NEXT_PUBLIC_DEMO_MODE` | `true` keeps the fake M-Pesa PIN buttons on a deployed demo. Never enable it with real Daraja. |

Migrations run automatically on each Vercel deploy (`prisma migrate deploy`).

## Known limits and next steps

- Login has no rate limiting yet.
- Teachers aren't assigned to classes, so any teacher can mark any class.
- Exams, grades and report cards are planned next.
- Overpayments (credit balances) aren't handled.
