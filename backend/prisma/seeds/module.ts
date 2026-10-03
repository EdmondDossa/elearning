import { PrismaClient } from '@prisma/client';
import { MODULE_DURATION_SEC } from './constants';
import { SeededCourse } from './course';

export type SeededModule = {
  id: string;
  mediaId: string;
  courseLanguage: string;
};

const MODULES: Record<string, string[]> = {
  c1: ['Pourquoi les conteneurs', 'Images et Dockerfile', 'Docker Compose'],
  c2: [
    'Architecture modulaire',
    'Injection de dépendances',
    'Guards et authentification',
  ],
  c3: ['Components and JSX', 'State and props', 'Hooks in depth'],
  c4: [
    'Modelado de amenazas',
    'Endurecimiento de sistemas',
    'Respuesta a incidentes',
  ],
};

export async function seedModules(
  prisma: PrismaClient,
  courses: SeededCourse[],
): Promise<SeededModule[]> {
  const seeded: SeededModule[] = [];

  for (const course of courses) {
    for (const [index, title] of (MODULES[course.key] ?? []).entries()) {
      const order = index + 1;
      const mediaId = `${course.key}m${order}`;
      const module = await prisma.module.create({
        data: {
          courseId: course.id,
          title,
          order,
          durationSec: MODULE_DURATION_SEC,
          videoUrl: `/media/${mediaId}.mp4`,
        },
      });
      seeded.push({ id: module.id, mediaId, courseLanguage: course.language });
    }
  }

  return seeded;
}
