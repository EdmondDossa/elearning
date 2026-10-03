import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { computeProgress } from '../common/progress.util';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Injectable()
export class CourseModulesService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertEnrolled(userId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) {
      throw new ForbiddenException(
        'Vous devez suivre cette formation pour accéder à ce module',
      );
    }
  }

  async findOne(moduleId: string, userId: string) {
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        audioTracks: {
          orderBy: [{ isDefault: 'desc' }, { language: 'asc' }],
          select: { language: true, label: true, url: true, isDefault: true },
        },
        subtitles: {
          orderBy: { language: 'asc' },
          select: { language: true, label: true, url: true },
        },
        progress: {
          where: { userId },
          select: { positionSec: true, completed: true },
        },
        course: {
          select: {
            id: true,
            title: true,
            modules: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                order: true,
                durationSec: true,
                progress: { where: { userId }, select: { completed: true } },
              },
            },
          },
        },
      },
    });
    if (!module) throw new NotFoundException('Module introuvable');

    await this.assertEnrolled(userId, module.courseId);

    const siblings = module.course.modules;
    const index = siblings.findIndex((m) => m.id === module.id);
    const completedCount = siblings.filter(
      (m) => m.progress[0]?.completed,
    ).length;

    return {
      id: module.id,
      title: module.title,
      description: module.description,
      order: module.order,
      durationSec: module.durationSec,
      videoUrl: module.videoUrl,
      audioTracks: module.audioTracks,
      subtitles: module.subtitles,
      progress: module.progress[0] ?? { positionSec: 0, completed: false },
      previousModuleId: siblings[index - 1]?.id ?? null,
      nextModuleId: siblings[index + 1]?.id ?? null,
      course: {
        id: module.course.id,
        title: module.course.title,
        progress: computeProgress(completedCount, siblings.length),
        modules: siblings.map((m) => ({
          id: m.id,
          title: m.title,
          order: m.order,
          durationSec: m.durationSec,
          completed: Boolean(m.progress[0]?.completed),
        })),
      },
    };
  }

  async updateProgress(
    moduleId: string,
    userId: string,
    dto: UpdateProgressDto,
  ) {
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
      select: { id: true, courseId: true, durationSec: true },
    });
    if (!module) throw new NotFoundException('Module introuvable');

    await this.assertEnrolled(userId, module.courseId);

    // Une position au-delà de la durée est ramenée à la fin du module
    const positionSec =
      dto.positionSec !== undefined
        ? Math.min(dto.positionSec, module.durationSec)
        : undefined;

    const completionUpdate =
      dto.completed === true
        ? { completed: true, completedAt: new Date() }
        : dto.completed === false
          ? { completed: false, completedAt: null }
          : {}; // non renseigné : on ne touche pas au statut

    const progress = await this.prisma.moduleProgress.upsert({
      where: { userId_moduleId: { userId, moduleId } },
      create: {
        userId,
        moduleId,
        positionSec: positionSec ?? 0,
        ...completionUpdate,
      },
      update: {
        ...(positionSec !== undefined && { positionSec }),
        ...completionUpdate,
      },
      select: { positionSec: true, completed: true },
    });

    const [total, completed] = await Promise.all([
      this.prisma.module.count({ where: { courseId: module.courseId } }),
      this.prisma.moduleProgress.count({
        where: {
          userId,
          completed: true,
          module: { courseId: module.courseId },
        },
      }),
    ]);

    return { ...progress, courseProgress: computeProgress(completed, total) };
  }
}
