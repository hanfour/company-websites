-- CreateTable
CREATE TABLE "UploadSession" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "totalSize" INTEGER NOT NULL,
    "chunkSize" INTEGER NOT NULL,
    "totalChunks" INTEGER NOT NULL,
    "uploadedChunks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tempPath" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UploadSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UploadSession_userId_idx" ON "UploadSession"("userId");

-- CreateIndex
CREATE INDEX "UploadSession_status_idx" ON "UploadSession"("status");
