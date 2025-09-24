/*
  Warnings:

  - You are about to drop the column `avatar` on the `Channels` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Channels" DROP COLUMN "avatar",
ADD COLUMN     "avatarFileId" UUID;

-- AddForeignKey
ALTER TABLE "public"."Channels" ADD CONSTRAINT "Channels_avatarFileId_fkey" FOREIGN KEY ("avatarFileId") REFERENCES "public"."ManagedFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
