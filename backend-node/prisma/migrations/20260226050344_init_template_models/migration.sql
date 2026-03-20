-- CreateEnum
CREATE TYPE "TemplateVideoType" AS ENUM ('YOUTUBE', 'FILE');

-- CreateEnum
CREATE TYPE "TemplateBlockType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'YOUTUBE', 'WARNING', 'INFO', 'CODE');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "subcategory" TEXT;

-- AlterTable
ALTER TABLE "ProjectVersion" ADD COLUMN     "board" TEXT;

-- CreateTable
CREATE TABLE "TemplateProject" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "bundle" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subCategory" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "fullDescription" TEXT NOT NULL,
    "heroVideoUrl" TEXT NOT NULL,
    "heroVideoType" "TemplateVideoType" NOT NULL,
    "previewSeconds" INTEGER,
    "certificateEnabled" BOOLEAN NOT NULL DEFAULT false,
    "certificateTitle" TEXT,
    "certificateText" TEXT,
    "badgeImageUrl" TEXT,
    "recommendedProjectId" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TemplateProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateSection" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "TemplateSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateLesson" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "sectionId" TEXT NOT NULL,

    CONSTRAINT "TemplateLesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateContentBlock" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "type" "TemplateBlockType" NOT NULL,
    "order" INTEGER NOT NULL,
    "text" TEXT,
    "imageUrl" TEXT,
    "videoUrl" TEXT,

    CONSTRAINT "TemplateContentBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateUserProjectProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "TemplateUserProjectProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateUserLessonProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TemplateUserLessonProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TemplateProject_slug_key" ON "TemplateProject"("slug");

-- CreateIndex
CREATE INDEX "Project_subcategory_idx" ON "Project"("subcategory");

-- CreateIndex
CREATE INDEX "ProjectVersion_board_idx" ON "ProjectVersion"("board");

-- AddForeignKey
ALTER TABLE "TemplateSection" ADD CONSTRAINT "TemplateSection_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "TemplateProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateLesson" ADD CONSTRAINT "TemplateLesson_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "TemplateSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateContentBlock" ADD CONSTRAINT "TemplateContentBlock_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "TemplateLesson"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateUserProjectProgress" ADD CONSTRAINT "TemplateUserProjectProgress_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "TemplateProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateUserLessonProgress" ADD CONSTRAINT "TemplateUserLessonProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "TemplateLesson"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
