/*
  Warnings:

  - You are about to drop the column `level` on the `ProjectSkill` table. All the data in the column will be lost.
  - You are about to drop the column `versionId` on the `ProjectSkill` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[projectId,skillId]` on the table `ProjectSkill` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `projectId` to the `ProjectSkill` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ProjectSkill" DROP CONSTRAINT "ProjectSkill_versionId_fkey";

-- DropIndex
DROP INDEX "ProjectSkill_versionId_skillId_key";

-- AlterTable
ALTER TABLE "ProjectSkill" DROP COLUMN "level",
DROP COLUMN "versionId",
ADD COLUMN     "projectId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Skill" ADD COLUMN     "description" TEXT,
ADD COLUMN     "level" TEXT NOT NULL DEFAULT 'Beginner';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "name" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ProjectSkill_projectId_skillId_key" ON "ProjectSkill"("projectId", "skillId");

-- AddForeignKey
ALTER TABLE "ProjectSkill" ADD CONSTRAINT "ProjectSkill_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
