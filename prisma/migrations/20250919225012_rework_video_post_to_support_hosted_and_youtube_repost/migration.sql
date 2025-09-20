-- CreateEnum
CREATE TYPE "public"."VideoTypes" AS ENUM ('HostedVideo', 'YoutubeRepost');

-- AlterTable
ALTER TABLE "public"."VideoPost" ADD COLUMN     "type" "public"."VideoTypes" NOT NULL DEFAULT 'HostedVideo';
