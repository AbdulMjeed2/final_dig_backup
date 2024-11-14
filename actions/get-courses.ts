import { Category, Course } from "@prisma/client";

import { getProgress } from "@/actions/get-progress";
import { db } from "@/lib/db";

type CourseWithProgressWithCategory = Course & {
  category: Category | null;
  chapters: { id: string }[];
  progress: number | null;
};

type GetCourses = {
  userId: string;
  title?: string;
  categoryId?: string;
};

export const getCourses = async ({
  userId,
  title,
  categoryId,
}: GetCourses): Promise<CourseWithProgressWithCategory[]> => {
  try {
    const courses = await db.course.findMany({
      where: {
        isPublished: true,
        title: {
          contains: title,
        },
        categoryId,
        chapters: {
          some: {
            isPublished: true,
            lessons: {
              some: {
                isPublished: true,
              },
            },
          },
        },
      },
      include: {
        exams: {
          select: {
            beforeScore: true,
          },
          take: 1,
        },
        category: true,
        chapters: {
          where: {
            isPublished: true,
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const progressPromises = courses.map((course) =>
      getProgress(userId, course.id)
    );
    const progressResults = await Promise.all(progressPromises);

    const coursesWithProgress: CourseWithProgressWithCategory[] = courses.map(
      (course, index) => {
        let courseProgressPercentage = progressResults[index];
        if (
          course.exams[0]?.beforeScore &&
          course.exams[0].beforeScore >= 50 &&
          courseProgressPercentage < 100
        ) {
          courseProgressPercentage = Math.min(courseProgressPercentage, 100);
        }
        return {
          ...course,
          progress: courseProgressPercentage,
        };
      }
    );

    return coursesWithProgress;
  } catch (error) {
    console.log("[GET_COURSES]", error);
    return [];
  }
};
