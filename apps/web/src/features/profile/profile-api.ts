import { z } from 'zod';
import type { UpdateProfileInput, UserProfile } from '@/features/profile/profile-types';
import { httpClient } from '@/lib/api/http-client';
import { parseApiResponse } from '@/lib/api/parse-response';

const userTypeSchema = z.enum(['operator', 'local_owner']);

const publicProfileSchema = z.object({
  bio: z.string().nullable(),
  id: z.string().min(1),
  name: z.string().nullable(),
  position: z.string().nullable(),
  type: userTypeSchema,
});

const userProfileSchema = publicProfileSchema.extend({
  age: z.number().int().nullable(),
  createdAt: z.string().min(1),
  email: z.email(),
  phone: z.string().nullable(),
});

async function getOwnProfile(): Promise<UserProfile> {
  const response = await httpClient.get<unknown>('/profile');
  return parseApiResponse(userProfileSchema, response.data);
}

async function getPublicProfile(userId: string) {
  const response = await httpClient.get<unknown>(`/profile/${userId}`);
  return parseApiResponse(publicProfileSchema, response.data);
}

async function updateOwnProfile(input: UpdateProfileInput): Promise<UserProfile> {
  const response = await httpClient.patch<unknown>('/profile', input);
  return parseApiResponse(userProfileSchema, response.data);
}

export { getOwnProfile, getPublicProfile, updateOwnProfile };
