import { z } from 'zod';
import type { AuthUser, LoginInput, RegisterInput } from '@/features/auth/auth-types';
import { httpClient } from '@/lib/api/http-client';
import { parseApiResponse } from '@/lib/api/parse-response';

const userTypeSchema = z.enum(['operator', 'local_owner']);

const authTokenSchema = z.object({
  accessToken: z.string().min(1),
});

const authUserSchema = z.object({
  type: userTypeSchema,
  userId: z.string().min(1),
});

const registeredUserSchema = z.object({
  createdAt: z.string(),
  email: z.email(),
  id: z.string().min(1),
  type: userTypeSchema,
});

async function getCurrentUser(): Promise<AuthUser> {
  const response = await httpClient.get<unknown>('/auth/me');
  return parseApiResponse(authUserSchema, response.data);
}

async function login(input: LoginInput): Promise<string> {
  const response = await httpClient.post<unknown>('/auth/login', input);
  return parseApiResponse(authTokenSchema, response.data).accessToken;
}

async function register(input: RegisterInput): Promise<void> {
  const response = await httpClient.post<unknown>('/auth/register', input);
  parseApiResponse(registeredUserSchema, response.data);
}

export { getCurrentUser, login, register };
