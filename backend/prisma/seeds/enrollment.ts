import { PrismaClient, User } from '@prisma/client';
import { SeededCourse } from './course';

// Le compte démo suit les deux premières formations
export async function seedEnrollments(
  prisma: PrismaClient,
  demoUser: User,
  courses: SeededCourse[],
) {
  const { count } = await prisma.enrollment.createMany({
    data: courses
      .slice(0, 2)
      .map((c) => ({ userId: demoUser.id, courseId: c.id })),
  });
  return count;
}
