import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AUTH_COOKIE, IS_PUBLIC_KEY } from '../auth.constants';
import { AuthenticatedRequest, JwtPayload } from '../auth.types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.cookies?.[AUTH_COOKIE] as string | undefined;

    if (isPublic) {
      // Route publique : on identifie l'utilisateur si possible, sans jamais bloquer
      if (token) {
        try {
          request.user = await this.jwt.verifyAsync<JwtPayload>(token);
        } catch {
          /* token invalide ou expiré : on continue en anonyme */
        }
      }
      return true;
    }

    if (!token) throw new UnauthorizedException('Authentification requise');

    try {
      request.user = await this.jwt.verifyAsync<JwtPayload>(token);
      return true;
    } catch {
      throw new UnauthorizedException('Session invalide ou expirée');
    }
  }
}
