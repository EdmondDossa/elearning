import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthSessionService } from '../auth-session.service';
import { AUTH_COOKIE, IS_PUBLIC_KEY } from '../auth.constants';
import { AuthenticatedRequest } from '../auth.types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly sessions: AuthSessionService,
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
      // Route publique : une session invalide est traitée comme anonyme.
      if (token) {
        try {
          request.user = await this.sessions.authenticate(token);
        } catch (error) {
          if (!(error instanceof UnauthorizedException)) throw error;
          /* token invalide, expiré ou révoqué : on continue en anonyme */
        }
      }
      return true;
    }

    if (!token) throw new UnauthorizedException('Authentification requise');

    try {
      request.user = await this.sessions.authenticate(token);
      return true;
    } catch (error) {
      if (!(error instanceof UnauthorizedException)) throw error;
      throw new UnauthorizedException('Session invalide ou expirée');
    }
  }
}
