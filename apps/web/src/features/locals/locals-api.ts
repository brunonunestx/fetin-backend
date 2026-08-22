import { z } from 'zod';
import type { CreateLocationInput, WorkLocation } from '@/features/locals/local-types';
import { httpClient } from '@/lib/api/http-client';
import { parseApiResponse } from '@/lib/api/parse-response';

const locationSchema = z.object({
  address: z.string(),
  city: z.string(),
  createdAt: z.string().refine((value) => !Number.isNaN(Date.parse(value))),
  id: z.string().min(1),
  name: z.string(),
  ownerId: z.string().min(1),
  state: z.string(),
  zipCode: z.string(),
});

async function listLocations(signal?: AbortSignal): Promise<WorkLocation[]> {
  const response = await httpClient.get<unknown>('/locals', { signal });
  return parseApiResponse(z.array(locationSchema), response.data);
}

async function getLocation(locationId: string, signal?: AbortSignal): Promise<WorkLocation> {
  const response = await httpClient.get<unknown>(`/locals/${locationId}`, { signal });
  return parseApiResponse(locationSchema, response.data);
}

async function createLocation(input: CreateLocationInput): Promise<WorkLocation> {
  const response = await httpClient.post<unknown>('/locals', input);
  return parseApiResponse(locationSchema, response.data);
}

export { createLocation, getLocation, listLocations };
