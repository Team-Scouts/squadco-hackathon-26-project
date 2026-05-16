/*
  Warnings:

  - Added the required column `title` to the `Alert` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'REVIEW', 'HIGH', 'CRITICAL');

-- AlterTable
ALTER TABLE "Alert" ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "severity" "AlertSeverity" NOT NULL DEFAULT 'INFO',
ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Document" ALTER COLUMN "updatedAt" DROP DEFAULT;
