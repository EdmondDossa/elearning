import { PrismaClient, User } from '@prisma/client';
import { SeededModule } from './module';

// Formation 1 : module 1 terminé, module 2 commencé à 8 s
export async function seedModuleProgress(
  prisma: PrismaClient,
  demoUser: User,
  modules: SeededModule[],
) {
  const byMediaId = new Map(modules.map((m) => [m.mediaId, m.id]));

  const { count } = await prisma.moduleProgress.createMany({
    data: [
      {
        userId: demoUser.id,
        moduleId: byMediaId.get('c1m1')!,
        positionSec: 20,
        completed: true,
        completedAt: new Date(),
      },
      {
        userId: demoUser.id,
        moduleId: byMediaId.get('c1m2')!,
        positionSec: 8,
        completed: false,
      },
    ],
  });
  return count;
}
