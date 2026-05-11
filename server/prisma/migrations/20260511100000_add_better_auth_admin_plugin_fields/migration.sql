ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banReason" TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banExpires" TIMESTAMP(3);

ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "impersonatedBy" TEXT;

UPDATE "user" SET "role" = 'admin' WHERE "role" = 'ADMIN';
UPDATE "user" SET "role" = 'reviewer' WHERE "role" = 'REVIEWER';
UPDATE "user" SET "role" = 'user' WHERE "role" = 'USER';
UPDATE "user" SET "role" = 'admin' WHERE "email" = 'admin@test.com';

ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'user';
