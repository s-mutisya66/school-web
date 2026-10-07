-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('MPESA', 'CASH', 'BANK');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'TEACHER', 'PARENT');

-- CreateTable
CREATE TABLE "SchoolClass" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "stream" TEXT,

    CONSTRAINT "SchoolClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" SERIAL NOT NULL,
    "admissionNo" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "schoolClassId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Term" (
    "id" SERIAL NOT NULL,
    "academicYear" TEXT NOT NULL,
    "termNumber" INTEGER NOT NULL,
    "startsOn" DATE NOT NULL,
    "endsOn" DATE NOT NULL,
    "feesDueOn" DATE NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Term_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeStructure" (
    "id" SERIAL NOT NULL,
    "schoolClassId" INTEGER NOT NULL,
    "termId" INTEGER NOT NULL,
    "item" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "FeeStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "termId" INTEGER NOT NULL,
    "amountDue" INTEGER NOT NULL,
    "amountPaid" INTEGER NOT NULL DEFAULT 0,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'UNPAID',
    "dueDate" DATE NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" "PaymentMethod" NOT NULL DEFAULT 'MPESA',
    "phone" TEXT,
    "merchantRequestId" TEXT,
    "checkoutRequestId" TEXT,
    "mpesaReceipt" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_Guardians" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_Guardians_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Student_admissionNo_key" ON "Student"("admissionNo");

-- CreateIndex
CREATE UNIQUE INDEX "Term_academicYear_termNumber_key" ON "Term"("academicYear", "termNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_studentId_termId_key" ON "Invoice"("studentId", "termId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_checkoutRequestId_key" ON "Payment"("checkoutRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_mpesaReceipt_key" ON "Payment"("mpesaReceipt");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "_Guardians_B_index" ON "_Guardians"("B");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_schoolClassId_fkey" FOREIGN KEY ("schoolClassId") REFERENCES "SchoolClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructure" ADD CONSTRAINT "FeeStructure_schoolClassId_fkey" FOREIGN KEY ("schoolClassId") REFERENCES "SchoolClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructure" ADD CONSTRAINT "FeeStructure_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Guardians" ADD CONSTRAINT "_Guardians_A_fkey" FOREIGN KEY ("A") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Guardians" ADD CONSTRAINT "_Guardians_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
