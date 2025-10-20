/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `Channels` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Channels" ADD COLUMN     "userId" TEXT NOT NULL DEFAULT 'badff94e-f106-46ee-b3c2-d44f23ba152b';

-- CreateIndex
CREATE UNIQUE INDEX "Channels_userId_key" ON "Channels"("userId");

-- AddForeignKey
ALTER TABLE "Channels" ADD CONSTRAINT "Channels_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
