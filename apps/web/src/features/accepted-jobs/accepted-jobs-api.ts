import { z } from 'zod';
import type { AcceptedJob } from '@/features/accepted-jobs/accepted-job-types';
import { httpClient } from '@/lib/api/http-client';
import { parseApiResponse } from '@/lib/api/parse-response';

const dateStringSchema = z.string().refine((value) => !Number.isNaN(Date.parse(value)));

const acceptedJobSchema = z.object({
  acceptedAt: dateStringSchema,
  cancelledAt: dateStringSchema.nullable(),
  description: z.string(),
  durationMinutes: z.number().int().positive(),
  jobId: z.string().min(1),
  local: z.object({
    address: z.string(),
    city: z.string(),
    id: z.string().min(1),
    latitude: z.number().min(-90).max(90).nullable(),
    longitude: z.number().min(-180).max(180).nullable(),
    name: z.string(),
    ownerId: z.string().min(1),
    state: z.string(),
    zipCode: z.string(),
  }),
  localId: z.string().min(1),
  startsAt: dateStringSchema,
  title: z.string(),
  value: z.string().regex(/^\d+(?:\.\d{1,2})?$/),
});

async function getAcceptedJobs(signal?: AbortSignal): Promise<AcceptedJob[]> {
  const response = await httpClient.get<unknown>('/me/accepted-jobs', { signal });
  return parseApiResponse(z.array(acceptedJobSchema), response.data);
}

export { getAcceptedJobs };
