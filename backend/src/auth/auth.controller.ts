import {
  ApiTags,
  ApiOperation,
  ApiCookieAuth,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CookieOptions, Response } from 'express';
import { UsersService } from '../users/users.service';
import { AUTH_COOKIE, AUTH_TTL_SEC } from './auth.constants';
import { AuthSessionService } from './auth-session.service';
import { AuthService } from './auth.service';
import { JwtPayload } from './auth.types';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Authentification')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: AuthSessionService,
    private readonly users: UsersService,
    private readonly config: ConfigService,
  ) {}

  private get cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.get('COOKIE_SECURE') === 'true',
      path: '/',
    };
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Créer un compte et une session' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, token } = await this.auth.register(dto);
    res.cookie(AUTH_COOKIE, token, {
      ...this.cookieOptions,
      maxAge: AUTH_TTL_SEC * 1000,
    });
    return user;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ouvrir une session' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, token } = await this.auth.login(dto);
    res.cookie(AUTH_COOKIE, token, {
      ...this.cookieOptions,
      maxAge: AUTH_TTL_SEC * 1000,
    });
    return user;
  }

  // Public : on doit pouvoir se déconnecter même avec un token expiré
  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Révoquer la session courante et effacer le cookie',
  })
  async logout(
    @CurrentUser() user: JwtPayload | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (user) await this.sessions.revoke(user);
    res.clearCookie(AUTH_COOKIE, this.cookieOptions);
  }

  @Get('me')
  @ApiOperation({ summary: 'Afficher le profil connecté' })
  @ApiCookieAuth()
  @ApiUnauthorizedResponse({
    description: 'Session absente, expirée ou révoquée',
  })
  async me(@CurrentUser() current: JwtPayload) {
    const user = await this.users.findPublicById(current.sub);
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }
}
