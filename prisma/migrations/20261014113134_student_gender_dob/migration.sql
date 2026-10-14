-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "dateOfBirth" DATE,
ADD COLUMN     "gender" "Gender";
