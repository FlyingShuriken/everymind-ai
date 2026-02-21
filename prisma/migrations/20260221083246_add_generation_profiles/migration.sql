-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "generationProfileId" TEXT;

-- CreateTable
CREATE TABLE "GenerationProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "customInstructions" TEXT,
    "sectionLength" TEXT NOT NULL DEFAULT 'medium',
    "includeExercises" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GenerationProfile_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_generationProfileId_fkey" FOREIGN KEY ("generationProfileId") REFERENCES "GenerationProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationProfile" ADD CONSTRAINT "GenerationProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
