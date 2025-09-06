-- AlterTable
ALTER TABLE "public"."VideoPost" ADD COLUMN     "duration" TEXT NOT NULL DEFAULT '12:34',
ADD COLUMN     "views" BIGINT NOT NULL DEFAULT 0;
