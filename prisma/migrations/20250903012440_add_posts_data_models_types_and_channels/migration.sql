-- CreateEnum
CREATE TYPE "public"."PostTypes" AS ENUM ('Video', 'Short', 'Image', 'Text', 'ImageText', 'Audio');

-- CreateTable
CREATE TABLE "public"."Channels" (
    "id" UUID NOT NULL,

    CONSTRAINT "Channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Posts" (
    "id" UUID NOT NULL,
    "type" "public"."PostTypes" NOT NULL,
    "channelsId" UUID NOT NULL,

    CONSTRAINT "Posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VideoPost" (
    "id" UUID NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "postId" UUID NOT NULL,

    CONSTRAINT "VideoPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShortPost" (
    "id" UUID NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "postId" UUID NOT NULL,

    CONSTRAINT "ShortPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ImagePost" (
    "id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "postId" UUID NOT NULL,

    CONSTRAINT "ImagePost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TextPost" (
    "id" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "postId" UUID NOT NULL,

    CONSTRAINT "TextPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ImageTextPost" (
    "id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "postId" UUID NOT NULL,

    CONSTRAINT "ImageTextPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AudioPost" (
    "id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "postId" UUID NOT NULL,

    CONSTRAINT "AudioPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VideoPost_postId_key" ON "public"."VideoPost"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "ShortPost_postId_key" ON "public"."ShortPost"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "ImagePost_postId_key" ON "public"."ImagePost"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "TextPost_postId_key" ON "public"."TextPost"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "ImageTextPost_postId_key" ON "public"."ImageTextPost"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "AudioPost_postId_key" ON "public"."AudioPost"("postId");

-- AddForeignKey
ALTER TABLE "public"."Posts" ADD CONSTRAINT "Posts_channelsId_fkey" FOREIGN KEY ("channelsId") REFERENCES "public"."Channels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VideoPost" ADD CONSTRAINT "VideoPost_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShortPost" ADD CONSTRAINT "ShortPost_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ImagePost" ADD CONSTRAINT "ImagePost_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TextPost" ADD CONSTRAINT "TextPost_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ImageTextPost" ADD CONSTRAINT "ImageTextPost_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AudioPost" ADD CONSTRAINT "AudioPost_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
