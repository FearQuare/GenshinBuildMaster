-- Users are now HoYoLAB accounts. Remove the placeholder "local-user" (and, by cascade,
-- anything it owned) before adding the required hoyolabUid column.
DELETE FROM "User" WHERE "id" = 'local-user';

-- AlterTable
ALTER TABLE "HoyolabSession" ADD COLUMN     "avatarUrl" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "hoyolabDeviceId",
ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "hoyolabUid" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_hoyolabUid_key" ON "User"("hoyolabUid");

