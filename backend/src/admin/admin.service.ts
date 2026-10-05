import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { readdir } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import {
  AudioTrackDto,
  CreateModuleDto,
  TrackDto,
  UpdateModuleDto,
} from './dto/module.dto';

const moduleInclude = {
  audioTracks: { orderBy: { language: 'asc' as const } },
  subtitles: { orderBy: { language: 'asc' as const } },
};

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- Formations ----------

  async listCourses() {
    const courses = await this.prisma.course.findMany({
      orderBy: { title: 'asc' },
      include: { _count: { select: { modules: true, enrollments: true } } },
    });
    return courses.map(({ _count, ...c }) => ({
      ...c,
      modulesCount: _count.modules,
      enrollmentsCount: _count.enrollments,
    }));
  }

  async getCourse(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        modules: { orderBy: { order: 'asc' }, include: moduleInclude },
      },
    });
    if (!course) throw new NotFoundException('Formation introuvable');
    return course;
  }

  createCourse(dto: CreateCourseDto) {
    return this.prisma.course.create({ data: dto });
  }

  async updateCourse(id: string, dto: UpdateCourseDto) {
    await this.ensureCourse(id);
    return this.prisma.course.update({ where: { id }, data: dto });
  }

  async deleteCourse(id: string) {
    await this.ensureCourse(id);
    // Cascade : modules, pistes, inscriptions et progressions associées
    await this.prisma.course.delete({ where: { id } });
  }

  // ---------- Modules ----------

  async createModule(courseId: string, dto: CreateModuleDto) {
    await this.ensureCourse(courseId);
    this.validateTracks(dto.audioTracks, dto.subtitles);

    const { _max } = await this.prisma.module.aggregate({
      where: { courseId },
      _max: { order: true },
    });

    const { audioTracks, subtitles, ...fields } = dto;
    return this.prisma.module.create({
      data: {
        ...fields,
        courseId,
        order: (_max.order ?? 0) + 1, // ajouté en fin de programme
        audioTracks: { create: audioTracks },
        subtitles: { create: subtitles ?? [] },
      },
      include: moduleInclude,
    });
  }

  async updateModule(id: string, dto: UpdateModuleDto) {
    const exists = await this.prisma.module.count({ where: { id } });
    if (!exists) throw new NotFoundException('Module introuvable');
    this.validateTracks(dto.audioTracks, dto.subtitles);

    const { audioTracks, subtitles, ...fields } = dto;

    // Transaction : soit tout est mis à jour, soit rien
    return this.prisma.$transaction(async (tx) => {
      if (audioTracks) {
        await tx.audioTrack.deleteMany({ where: { moduleId: id } });
        await tx.audioTrack.createMany({
          data: audioTracks.map((t) => ({ ...t, moduleId: id })),
        });
      }
      if (subtitles) {
        await tx.subtitle.deleteMany({ where: { moduleId: id } });
        await tx.subtitle.createMany({
          data: subtitles.map((s) => ({ ...s, moduleId: id })),
        });
      }
      return tx.module.update({
        where: { id },
        data: fields,
        include: moduleInclude,
      });
    });
  }

  async deleteModule(id: string) {
    const module = await this.prisma.module.findUnique({
      where: { id },
      select: { courseId: true, order: true },
    });
    if (!module) throw new NotFoundException('Module introuvable');

    await this.prisma.$transaction(async (tx) => {
      await tx.module.delete({ where: { id } });

      // Renumérotation des modules suivants (ordre croissant pour respecter la contrainte unique)
      const following = await tx.module.findMany({
        where: { courseId: module.courseId, order: { gt: module.order } },
        orderBy: { order: 'asc' },
        select: { id: true, order: true },
      });
      for (const m of following) {
        await tx.module.update({
          where: { id: m.id },
          data: { order: m.order - 1 },
        });
      }
    });
  }

  // ---------- Médias ----------

  async listMedia() {
    const files = (await readdir(join(process.cwd(), 'media'))).sort();
    const toUrl = (f: string) => `/media/${f}`;
    return {
      videos: files.filter((f) => f.endsWith('.mp4')).map(toUrl),
      audio: files.filter((f) => /\.(m4a|mp3|aac|ogg)$/.test(f)).map(toUrl),
      subtitles: files.filter((f) => f.endsWith('.vtt')).map(toUrl),
    };
  }

  // ---------- Règles métier ----------

  private async ensureCourse(id: string) {
    const exists = await this.prisma.course.count({ where: { id } });
    if (!exists) throw new NotFoundException('Formation introuvable');
  }

  private validateTracks(audio?: AudioTrackDto[], subtitles?: TrackDto[]) {
    if (audio) {
      if (new Set(audio.map((t) => t.language)).size !== audio.length) {
        throw new BadRequestException('Une seule piste audio par langue');
      }
      if (audio.filter((t) => t.isDefault).length !== 1) {
        throw new BadRequestException(
          'Exactement une piste audio doit être la version originale',
        );
      }
    }
    if (
      subtitles &&
      new Set(subtitles.map((s) => s.language)).size !== subtitles.length
    ) {
      throw new BadRequestException('Un seul sous-titre par langue');
    }
  }
}
