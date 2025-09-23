/*
  Warnings:

  - You are about to drop the column `thumbnail` on the `VideoPost` table. All the data in the column will be lost.
  - You are about to drop the `ShortPost` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `thumbnailFileId` to the `VideoPost` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."Prefixes" AS ENUM ('img', 'wtt');

-- DropForeignKey
ALTER TABLE "public"."ShortPost" DROP CONSTRAINT "ShortPost_postId_fkey";

-- AlterTable
ALTER TABLE "public"."VideoPost" DROP COLUMN "thumbnail",
ADD COLUMN     "thumbnailFileId" UUID NOT NULL,
ADD COLUMN     "torrentFileId" UUID,
ALTER COLUMN "mediaUrl" DROP NOT NULL;

-- DropTable
DROP TABLE "public"."ShortPost";

-- CreateTable
CREATE TABLE "public"."ManagedFile" (
    "id" UUID NOT NULL,
    "prefix" "public"."Prefixes" NOT NULL,
    "filename" TEXT NOT NULL,
    "hash" TEXT NOT NULL,

    CONSTRAINT "ManagedFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ManagedFile_hash_key" ON "public"."ManagedFile"("hash");

-- AddForeignKey
ALTER TABLE "public"."VideoPost" ADD CONSTRAINT "VideoPost_torrentFileId_fkey" FOREIGN KEY ("torrentFileId") REFERENCES "public"."ManagedFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VideoPost" ADD CONSTRAINT "VideoPost_thumbnailFileId_fkey" FOREIGN KEY ("thumbnailFileId") REFERENCES "public"."ManagedFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
