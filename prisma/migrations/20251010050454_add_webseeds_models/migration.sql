-- CreateTable
CREATE TABLE "public"."WebSeedProviders" (
    "id" UUID NOT NULL,
    "basePath" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "WebSeedProviders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WebSeeds" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "providerId" UUID NOT NULL,
    "videoId" UUID NOT NULL,

    CONSTRAINT "WebSeeds_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."WebSeeds" ADD CONSTRAINT "WebSeeds_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."WebSeedProviders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WebSeeds" ADD CONSTRAINT "WebSeeds_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "public"."VideoPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
