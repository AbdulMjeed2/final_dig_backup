-- AlterTable
ALTER TABLE `UserProgress` MODIFY `lessonId` varchar(191) NULL;

-- AlterTable
ALTER TABLE `Certificate` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- DropTable
DROP TABLE `Result`;

-- CreateTable
CREATE TABLE `DialogBoxCheck` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `page` ENUM('introductionPage', 'goalsPage', 'contactPage', 'coursesPage', 'messagesPage', 'leaderboardPage', 'libraryPage') NOT NULL,
    `checked` BOOLEAN NOT NULL DEFAULT false,
    `userId` VARCHAR(191) NOT NULL,

    INDEX `DialogBoxCheck_userId_idx`(`userId` ASC),
    UNIQUE INDEX `DialogBoxCheck_userId_page_key`(`userId` ASC, `page` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExamOptionsResponse` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `examId` VARCHAR(191) NOT NULL,
    `options` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ExamOptionsResponse_courseId_idx`(`courseId` ASC),
    INDEX `ExamOptionsResponse_examId_idx`(`examId` ASC),
    UNIQUE INDEX `ExamOptionsResponse_userId_examId_key`(`userId` ASC, `examId` ASC),
    INDEX `ExamOptionsResponse_userId_idx`(`userId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

