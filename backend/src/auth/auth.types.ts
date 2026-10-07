import { Role } from '@prisma/client';
import { Request } from 'express';

export interface JwtPayload {
  sub: string;
  sid: string;
  role: Role;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
