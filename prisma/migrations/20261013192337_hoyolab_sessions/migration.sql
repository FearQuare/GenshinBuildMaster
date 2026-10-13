-- AlterTable
ALTER TABLE "User" ADD COLUMN     "hoyolabDeviceId" TEXT;

-- CreateTable
CREATE TABLE "HoyolabSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ltuid" TEXT NOT NULL,
    "ltokenEncrypted" TEXT NOT NULL,
    "hoyolabUid" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "server" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HoyolabSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HoyolabSession_userId_idx" ON "HoyolabSession"("userId");

-- AddForeignKey
ALTER TABLE "HoyolabSession" ADD CONSTRAINT "HoyolabSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
