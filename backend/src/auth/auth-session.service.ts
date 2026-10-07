import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PublicUser } from '../users/users.service';
import { AUTH_TTL_SEC } from './auth.constants';
import { JwtPayload } from './auth.types';

@Injectable()
export class AuthSessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async issue(user: PublicUser): Promise<string> {
    const sid = randomUUID();
    const expiresAt = new Date(Date.now() + AUTH_TTL_SEC * 1000);
    const token = await this.jwt.signAsync({
      sub: user.id,
      role: user.role,
      sid,
    });
    // Une session distincte par connexion : déconnecter un appareil n'affecte pas les autres.
    await this.prisma.authSession.create({
      data: { id: sid, userId: user.id, expiresAt },
    });
    // Nettoyage opportuniste des anciennes sessions de cet utilisateur.
    await this.prisma.authSession.deleteMany({
      where: { userId: user.id, expiresAt: { lte: new Date() } },
    });
    return token;
  }

  async authenticate(token: string): Promise<JwtPayload> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Token invalide ou expiré');
    }
    if (typeof payload.sid !== 'string' || typeof payload.sub !== 'string') {
      throw new UnauthorizedException('Session invalide');
    }
    const session = await this.prisma.authSession.findUnique({
      where: { id: payload.sid },
      include: { user: { select: { role: true } } },
    });
    if (
      !session ||
      session.userId !== payload.sub ||
      session.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException('Session expirée ou révoquée');
    }
    return { sub: session.userId, sid: session.id, role: session.user.role };
  }

  async revoke(user: JwtPayload): Promise<void> {
    // deleteMany rend la déconnexion répétée sans effet supplémentaire.
    await this.prisma.authSession.deleteMany({
      where: { id: user.sid, userId: user.sub },
    });
  }
}
