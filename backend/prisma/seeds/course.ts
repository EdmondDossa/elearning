import { Course, Level, PrismaClient } from '@prisma/client';

export type SeededCourse = Course & { key: string };

const COURSES = [
  {
    key: 'c1',
    title: 'Introduction à Docker',
    instructor: 'Sophie Martin',
    language: 'fr',
    level: Level.BEGINNER,
    description:
      'Comprendre les conteneurs, les images et Docker Compose pour packager une application.',
  },
  {
    key: 'c2',
    title: 'NestJS en pratique',
    instructor: 'Karim Diallo',
    language: 'fr',
    level: Level.INTERMEDIATE,
    description:
      'Construire une API REST structurée avec NestJS : modules, services, guards et tests.',
  },
  {
    key: 'c3',
    title: 'React Fundamentals',
    instructor: 'John Carter',
    language: 'en',
    level: Level.BEGINNER,
    description:
      'Learn components, props, state and hooks to build modern user interfaces.',
  },
  {
    key: 'c4',
    title: 'Ciberseguridad avanzada',
    instructor: 'Lucía Gómez',
    language: 'es',
    level: Level.ADVANCED,
    description:
      'Análisis de amenazas, endurecimiento de sistemas y respuesta a incidentes.',
  },
];

export async function seedCourses(
  prisma: PrismaClient,
): Promise<SeededCourse[]> {
  return Promise.all(
    COURSES.map(async ({ key, ...data }) => ({
      key,
      ...(await prisma.course.create({ data })),
    })),
  );
}
