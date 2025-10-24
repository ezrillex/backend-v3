-- CreateEnum
CREATE TYPE "PostTypes" AS ENUM ('Video', 'Short', 'Image', 'Text', 'ImageText', 'Audio');

-- CreateEnum
CREATE TYPE "VideoTypes" AS ENUM ('HostedVideo', 'YoutubeRepost');

-- CreateEnum
CREATE TYPE "Prefixes" AS ENUM ('img', 'wtt');

-- CreateTable
CREATE TABLE "Channels" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "avatarFileId" UUID,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Posts" (
    "id" UUID NOT NULL,
    "type" "PostTypes" NOT NULL,
    "channelsId" UUID NOT NULL,
    "title" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "kilobytes" INTEGER NOT NULL DEFAULT 0,
    "likes" BIGINT NOT NULL DEFAULT 0,
    "views" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoPost" (
    "id" UUID NOT NULL,
    "type" "VideoTypes" NOT NULL,
    "mediaUrl" TEXT,
    "description" TEXT NOT NULL,
    "duration" TEXT,
    "postId" UUID NOT NULL,
    "torrentFileId" UUID,
    "thumbnailFileId" UUID NOT NULL,

    CONSTRAINT "VideoPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TextPost" (
    "id" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "postId" UUID NOT NULL,

    CONSTRAINT "TextPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManagedFile" (
    "id" UUID NOT NULL,
    "prefix" "Prefixes" NOT NULL,
    "hash" TEXT NOT NULL,

    CONSTRAINT "ManagedFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImagePost" (
    "id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "postId" UUID NOT NULL,

    CONSTRAINT "ImagePost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageTextPost" (
    "id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "postId" UUID NOT NULL,

    CONSTRAINT "ImageTextPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AudioPost" (
    "id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "postId" UUID NOT NULL,

    CONSTRAINT "AudioPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebSeedProviders" (
    "id" UUID NOT NULL,
    "basePath" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "WebSeedProviders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebSeeds" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "providerId" UUID NOT NULL,
    "videoId" UUID NOT NULL,

    CONSTRAINT "WebSeeds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Channels_userId_key" ON "Channels"("userId");

-- CreateIndex
CREATE INDEX "Channels_avatarFileId_idx" ON "Channels"("avatarFileId");

-- CreateIndex
CREATE INDEX "Posts_createdAt_idx" ON "Posts"("createdAt");

-- CreateIndex
CREATE INDEX "Posts_id_idx" ON "Posts"("id");

-- CreateIndex
CREATE UNIQUE INDEX "VideoPost_postId_key" ON "VideoPost"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "TextPost_postId_key" ON "TextPost"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "ManagedFile_hash_key" ON "ManagedFile"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "ImagePost_postId_key" ON "ImagePost"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "ImageTextPost_postId_key" ON "ImageTextPost"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "AudioPost_postId_key" ON "AudioPost"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- AddForeignKey
ALTER TABLE "Channels" ADD CONSTRAINT "Channels_avatarFileId_fkey" FOREIGN KEY ("avatarFileId") REFERENCES "ManagedFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Channels" ADD CONSTRAINT "Channels_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Posts" ADD CONSTRAINT "Posts_channelsId_fkey" FOREIGN KEY ("channelsId") REFERENCES "Channels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoPost" ADD CONSTRAINT "VideoPost_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoPost" ADD CONSTRAINT "VideoPost_torrentFileId_fkey" FOREIGN KEY ("torrentFileId") REFERENCES "ManagedFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoPost" ADD CONSTRAINT "VideoPost_thumbnailFileId_fkey" FOREIGN KEY ("thumbnailFileId") REFERENCES "ManagedFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextPost" ADD CONSTRAINT "TextPost_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImagePost" ADD CONSTRAINT "ImagePost_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageTextPost" ADD CONSTRAINT "ImageTextPost_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AudioPost" ADD CONSTRAINT "AudioPost_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebSeeds" ADD CONSTRAINT "WebSeeds_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "WebSeedProviders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebSeeds" ADD CONSTRAINT "WebSeeds_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "VideoPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
