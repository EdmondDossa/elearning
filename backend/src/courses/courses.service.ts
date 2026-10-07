import { Injectable, NotFoundException } from '@nestjs/common';
import { Level, Prisma } from '@prisma/client';
import { computeProgress } from '../common/progress.util';
import { PrismaService } from '../prisma/prisma.service';
import { QueryCoursesDto } from './dto/query-courses.dto';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll({ search, language, level }: QueryCoursesDto, userId?: string) {
    const where: Prisma.CourseWhereInput = {
      ...(language && { language }),
      ...(level && { level }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { instructor: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const courses = await this.prisma.course.findMany({
      where,
      orderBy: { title: 'asc' },
      select: {
        id: true,
        title: true,
        instructor: true,
        language: true,
        level: true,
        description: true,
        thumbnailUrl: true,
        _count: { select: { modules: true } },
      },
    });

    // Requêtes groupées, limitées aux résultats et à l'utilisateur courant.
    const courseIds = courses.map((course) => course.id);
    const [enrollments, activity] =
      userId && courseIds.length
        ? await Promise.all([
            this.prisma.enrollment.findMany({
              where: { userId, courseId: { in: courseIds } },
              select: { courseId: true },
            }),
            this.prisma.moduleProgress.findMany({
              where: { userId, module: { courseId: { in: courseIds } } },
              select: {
                completed: true,
                positionSec: true,
                module: { select: { courseId: true } },
              },
            }),
          ])
        : [[], []];
    const enrolled = new Set(enrollments.map((entry) => entry.courseId));
    const progressByCourse = new Map<
      string,
      { completed: number; started: boolean }
    >();
    for (const entry of activity) {
      const progress = progressByCourse.get(entry.module.courseId) ?? {
        completed: 0,
        started: false,
      };
      if (entry.completed) progress.completed++;
      progress.started ||= entry.completed || entry.positionSec > 0;
      progressByCourse.set(entry.module.courseId, progress);
    }
    return courses.map(({ _count, ...course }) => {
      const activity = progressByCourse.get(course.id);
      const completedModules = activity?.completed ?? 0;
      const status =
        _count.modules > 0 && completedModules === _count.modules
          ? ('COMPLETED' as const)
          : activity?.started
            ? ('IN_PROGRESS' as const)
            : ('NOT_STARTED' as const);
      return {
        ...course,
        modulesCount: _count.modules,
        learning: enrolled.has(course.id)
          ? {
              status,
              completedModules,
              progress: computeProgress(completedModules, _count.modules),
            }
          : null,
      };
    });
  }

  async getFilters() {
    const languages = await this.prisma.course.findMany({
      distinct: ['language'],
      select: { language: true },
      orderBy: { language: 'asc' },
    });
    return {
      languages: languages.map((l) => l.language),
      levels: Object.values(Level),
    };
  }

  async findOne(id: string, userId?: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            order: true,
            durationSec: true,
          },
        },
      },
    });
    if (!course) throw new NotFoundException('Formation introuvable');

    // Visiteur anonyme : pas d'information de progression
    if (!userId) {
      return {
        ...course,
        enrolled: false,
        progress: null,
        modules: course.modules.map((m) => ({ ...m, completed: false })),
      };
    }

    const [enrollment, completed] = await Promise.all([
      this.prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId: id } },
      }),
      this.prisma.moduleProgress.findMany({
        where: { userId, completed: true, module: { courseId: id } },
        select: { moduleId: true },
      }),
    ]);

    const completedIds = new Set(completed.map((p) => p.moduleId));

    return {
      ...course,
      enrolled: Boolean(enrollment),
      progress: computeProgress(completedIds.size, course.modules.length),
      modules: course.modules.map((m) => ({
        ...m,
        completed: completedIds.has(m.id),
      })),
    };
  }

  async enroll(courseId: string, userId: string) {
    const exists = await this.prisma.course.count({ where: { id: courseId } });
    if (!exists) throw new NotFoundException('Formation introuvable');

    await this.prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: { userId, courseId },
      update: {},
    });
    return { enrolled: true };
  }
}
