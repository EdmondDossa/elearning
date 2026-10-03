import { Injectable } from '@nestjs/common';
import { computeProgress } from '../common/progress.util';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(userId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            instructor: true,
            language: true,
            level: true,
            thumbnailUrl: true,
            modules: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                progress: {
                  where: { userId },
                  select: { completed: true, updatedAt: true },
                },
              },
            },
          },
        },
      },
    });

    const courses = enrollments
      .map(({ course, createdAt }) => {
        const { modules, ...info } = course;
        const total = modules.length;
        const completedModules = modules.filter(
          (m) => m.progress[0]?.completed,
        ).length;

        const activity = modules.flatMap((m) =>
          m.progress.map((p) => p.updatedAt.getTime()),
        );
        const lastActivityAt = new Date(
          activity.length ? Math.max(...activity) : createdAt.getTime(),
        );

        // Reprise : premier module non terminé, sinon le premier
        const resume =
          modules.find((m) => !m.progress[0]?.completed) ?? modules[0];

        return {
          ...info,
          totalModules: total,
          completedModules,
          progress: computeProgress(completedModules, total),
          completed: total > 0 && completedModules === total,
          enrolledAt: createdAt,
          lastActivityAt,
          resumeModuleId: resume?.id ?? null,
        };
      })
      .sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime());

    return {
      stats: {
        enrolled: courses.length,
        inProgress: courses.filter((c) => !c.completed).length,
        completed: courses.filter((c) => c.completed).length,
      },
      courses,
    };
  }
}
