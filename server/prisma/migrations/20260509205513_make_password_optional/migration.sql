-- AlterTable
ALTER TABLE "account" ALTER COLUMN "password" DROP NOT NULL;

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "password" DROP NOT NULL;
