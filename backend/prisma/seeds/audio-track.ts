import { PrismaClient } from '@prisma/client';
import { LANGS } from './constants';
import { SeededModule } from './module';

export async function seedAudioTracks(
  prisma: PrismaClient,
  modules: SeededModule[],
) {
  const { count } = await prisma.audioTrack.createMany({
    data: modules.flatMap((m) =>
      LANGS.map((l) => ({
        moduleId: m.id,
        language: l.code,
        label: l.label,
        url: `/media/${m.mediaId}.${l.code}.m4a`,
        isDefault: l.code === m.courseLanguage,
      })),
    ),
  });
  return count;
}
