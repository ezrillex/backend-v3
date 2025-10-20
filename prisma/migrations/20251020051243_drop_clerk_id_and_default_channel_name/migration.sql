/*
  Warnings:

  - You are about to drop the column `clerkId` on the `Channels` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Channels" DROP COLUMN "clerkId",
ALTER COLUMN "name" DROP DEFAULT;
