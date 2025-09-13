-- AlterTable
ALTER TABLE "public"."Channels" ADD COLUMN     "clerkId" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "name" SET DEFAULT 'Nuevo Canal';
