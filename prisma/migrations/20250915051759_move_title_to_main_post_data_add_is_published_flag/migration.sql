/*
  Warnings:

  - You are about to drop the column `title` on the `VideoPost` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Posts" ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "title" TEXT NOT NULL DEFAULT 'Titulo Predeterminado';

-- AlterTable
ALTER TABLE "public"."VideoPost" DROP COLUMN "title";
