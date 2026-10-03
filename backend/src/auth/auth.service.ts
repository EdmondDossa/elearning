import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { PublicUser, toPublicUser, UsersService } from '../users/users.service';
import { JwtPayload } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async register(
    dto: RegisterDto,
  ): Promise<{ user: PublicUser; token: string }> {
    if (await this.users.findByEmail(dto.email)) {
      throw new ConflictException('Un compte existe déjà avec cet email');
    }

    try {
      const passwordHash = await argon2.hash(dto.password);
      const user = await this.users.create({
        email: dto.email,
        name: dto.name,
        passwordHash,
      });
      return { user, token: await this.sign(user) };
    } catch (e) {
      // Deux inscriptions simultanées avec le même email : la contrainte unique tranche
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('Un compte existe déjà avec cet email');
      }
      throw e;
    }
  }

  async login(dto: LoginDto): Promise<{ user: PublicUser; token: string }> {
    const user = await this.users.findByEmail(dto.email);
    const valid = user
      ? await argon2.verify(user.passwordHash, dto.password)
      : false;

    if (!user || !valid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const publicUser = toPublicUser(user);
    return { user: publicUser, token: await this.sign(publicUser) };
  }

  private sign(user: PublicUser): Promise<string> {
    const payload: JwtPayload = { sub: user.id, role: user.role };
    return this.jwt.signAsync(payload);
  }
}
