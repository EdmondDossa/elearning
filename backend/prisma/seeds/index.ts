import { PrismaClient, Role } from '@prisma/client';
import { seedAudioTracks } from './audio-track';
import { seedCourses } from './course';
import { seedEnrollments } from './enrollment';
import { seedModuleProgress } from './module-progress';
import { seedModules } from './module';
import { seedSubtitles } from './subtitle';
import { seedUsers } from './user';

const prisma = new PrismaClient();

// Suppression dans l'ordre inverse des dépendances (enfants avant parents)
async function reset() {
  await prisma.moduleProgress.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.subtitle.deleteMany();
  await prisma.audioTrack.deleteMany();
  await prisma.module.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  await reset();

  const users = await seedUsers(prisma);
  const courses = await seedCourses(prisma);
  const modules = await seedModules(prisma, courses);
  const audioTracks = await seedAudioTracks(prisma, modules);
  const subtitles = await seedSubtitles(prisma, modules);

  const demoUser = users.find((u) => u.role === Role.USER)!;
  const enrollments = await seedEnrollments(prisma, demoUser, courses);
  const progress = await seedModuleProgress(prisma, demoUser, modules);

  console.table({
    users: users.length,
    courses: courses.length,
    modules: modules.length,
    audioTracks,
    subtitles,
    enrollments,
    progress,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
