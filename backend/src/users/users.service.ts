import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{
  select: typeof publicUserSelect;
}>;

export function toPublicUser(user: User): PublicUser {
  const { id, email, name, role, createdAt } = user;
  return { id, email, name, role, createdAt };
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findPublicById(id: string): Promise<PublicUser | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: publicUserSelect,
    });
  }

  create(data: {
    email: string;
    name: string;
    passwordHash: string;
  }): Promise<PublicUser> {
    return this.prisma.user.create({ data, select: publicUserSelect });
  }
}
