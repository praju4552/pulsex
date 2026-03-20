/*
  Warnings:

  - You are about to drop the `TemplateContentBlock` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TemplateLesson` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TemplateProject` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TemplateSection` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TemplateUserLessonProgress` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TemplateUserProjectProgress` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TemplateContentBlock" DROP CONSTRAINT "TemplateContentBlock_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "TemplateLesson" DROP CONSTRAINT "TemplateLesson_sectionId_fkey";

-- DropForeignKey
ALTER TABLE "TemplateSection" DROP CONSTRAINT "TemplateSection_projectId_fkey";

-- DropForeignKey
ALTER TABLE "TemplateUserLessonProgress" DROP CONSTRAINT "TemplateUserLessonProgress_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "TemplateUserProjectProgress" DROP CONSTRAINT "TemplateUserProjectProgress_projectId_fkey";

-- DropTable
DROP TABLE "TemplateContentBlock";

-- DropTable
DROP TABLE "TemplateLesson";

-- DropTable
DROP TABLE "TemplateProject";

-- DropTable
DROP TABLE "TemplateSection";

-- DropTable
DROP TABLE "TemplateUserLessonProgress";

-- DropTable
DROP TABLE "TemplateUserProjectProgress";

-- DropEnum
DROP TYPE "TemplateBlockType";

-- DropEnum
DROP TYPE "TemplateVideoType";
