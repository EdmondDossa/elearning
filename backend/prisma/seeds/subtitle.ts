import { PrismaClient } from '@prisma/client';
import { LANGS } from './constants';
import { SeededModule } from './module';

export async function seedSubtitles(
  prisma: PrismaClient,
  modules: SeededModule[],
) {
  const { count } = await prisma.subtitle.createMany({
    data: modules.flatMap((m) =>
      LANGS.map((l) => ({
        moduleId: m.id,
        language: l.code,
        label: l.label,
        url: `/media/${m.mediaId}.${l.code}.vtt`,
      })),
    ),
  });
  return count;
}
