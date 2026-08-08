-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('USER_INVITED', 'ROOM_MEMBER_ADDED', 'ROOM_MEMBER_REMOVED', 'IMPORT_COMPLETED', 'IMPORT_FAILED', 'DM_MESSAGE');

-- CreateEnum
CREATE TYPE "public"."AttachmentKind" AS ENUM ('IMAGE', 'DOCUMENT', 'AUDIO');

-- CreateEnum
CREATE TYPE "public"."AttachmentStatus" AS ENUM ('PENDING', 'ATTACHED');

-- AlterEnum
ALTER TYPE "public"."MessageType" ADD VALUE IF NOT EXISTS 'AUDIO';

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "type" "public"."NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "metadata" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."attachments" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "url" TEXT,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "kind" "public"."AttachmentKind" NOT NULL,
    "status" "public"."AttachmentStatus" NOT NULL DEFAULT 'PENDING',
    "durationMs" INTEGER,
    "uploadedById" TEXT NOT NULL,
    "messageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_recipientId_readAt_createdAt_idx" ON "public"."notifications"("recipientId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_workspaceId_idx" ON "public"."notifications"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "attachments_key_key" ON "public"."attachments"("key");

-- CreateIndex
CREATE INDEX "attachments_uploadedById_status_idx" ON "public"."attachments"("uploadedById", "status");

-- CreateIndex
CREATE INDEX "attachments_messageId_idx" ON "public"."attachments"("messageId");

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attachments" ADD CONSTRAINT "attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attachments" ADD CONSTRAINT "attachments_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
