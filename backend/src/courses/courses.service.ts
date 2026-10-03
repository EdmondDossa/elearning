import { Injectable, NotFoundException } from '@nestjs/common';
import { Level, Prisma } from '@prisma/client';
import { computeProgress } from '../common/progress.util';
import { PrismaService } from '../prisma/prisma.service';
import { QueryCoursesDto } from './dto/query-courses.dto';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll({ search, language, level }: QueryCoursesDto) {
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

    return courses.map(({ _count, ...course }) => ({
      ...course,
      modulesCount: _count.modules,
    }));
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
