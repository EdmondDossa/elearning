import { PrismaClient, Role, User } from '@prisma/client';
import * as argon2 from 'argon2';

export const DEMO_PASSWORD = 'Demo1234!';

const USERS = [
  { email: 'demo@elearning.local', name: 'Utilisateur Démo', role: Role.USER },
  { email: 'admin@elearning.local', name: 'Administrateur', role: Role.ADMIN },
];

export async function seedUsers(prisma: PrismaClient): Promise<User[]> {
  const passwordHash = await argon2.hash(DEMO_PASSWORD);
  return Promise.all(
    USERS.map((user) =>
      prisma.user.create({ data: { ...user, passwordHash } }),
    ),
  );
}
