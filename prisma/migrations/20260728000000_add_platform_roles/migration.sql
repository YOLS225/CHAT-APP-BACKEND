-- CreateEnum
CREATE TYPE "public"."PlatformRole" AS ENUM ('SUPER_ADMIN', 'USER');

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN "platformRole" "public"."PlatformRole" NOT NULL DEFAULT 'USER';

