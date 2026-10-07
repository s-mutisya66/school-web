# School fees module (Next.js + Prisma + PostgreSQL)

Copy `prisma/` and `src/` into a Next.js (App Router, TypeScript, `@/` alias) project.

```bash
npm i prisma@6 @prisma/client@6
# .env: DATABASE_URL="postgresql://..."   (Neon or Supabase free tier works)
npx prisma migrate dev --name fees
npx prisma studio   # add a class, student, term and fee items to test
```

Test flow:
1. `POST /api/terms/1/invoices/generate`
2. `POST /api/students/1/payments/mpesa` with `{ "phone": "0712345678", "amount": 5000 }`
3. `POST /api/payments/1/simulate` with `{ "success": true }` (or `false` to cancel)
4. `GET /api/students/1/invoices`

## Auth and roles

```bash
npm i jose bcryptjs
npm i -D tsx
# .env: AUTH_SECRET="<output of: openssl rand -base64 32>"
# package.json: "prisma": { "seed": "tsx prisma/seed.ts" }
npx prisma migrate dev --name auth
npx prisma db seed
```

Demo logins (from the seed): `admin@school.test` / `admin123`, `parent@school.test` / `parent123`.

- ADMIN: generates invoices, views any student's fees.
- PARENT: sees only their own children (linked through `User.children`).
- TEACHER: no fee access.
- `/api/mpesa/callback` stays public by design (Safaricom calls it); in a real Daraja setup you'd also restrict it to Safaricom's IPs.
- Pages redirect to `/login` on a 401; the real enforcement is in the API routes.

## Students, classes and users

Admin pages (sign in as admin): `/admin/students`, `/admin/users`, `/admin/fees`.

1. Users: create parent and teacher accounts (admin accounts come from the seed only).
2. Students: add a class, add students, and link a parent by email (or use "Parents" on a row).
3. Fees: generate invoices for a term.

Students are deactivated instead of deleted, so invoices and payment history are never lost.
