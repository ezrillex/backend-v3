/*
  Warnings:

  - You are about to drop the column `views` on the `VideoPost` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Posts" ADD COLUMN     "views" BIGINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."VideoPost" DROP COLUMN "views";
