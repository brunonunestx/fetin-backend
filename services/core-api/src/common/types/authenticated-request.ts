import { Request } from 'express';
import { UserType } from '../../generated/prisma/client';

export interface AuthenticatedUser {
  userId: string;
  type: UserType;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
