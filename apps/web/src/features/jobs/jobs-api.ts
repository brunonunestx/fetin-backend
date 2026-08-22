import { z } from 'zod';
import type { Job, JobAcceptanceStatus } from '@/features/jobs/job-types';
import { httpClient } from '@/lib/api/http-client';
import { parseApiResponse } from '@/lib/api/parse-response';

const dateStringSchema = z.string().refine((value) => !Number.isNaN(Date.parse(value)));

const jobLocalSchema = z.object({
  address: z.string(),
  city: z.string(),
  id: z.string().min(1),
  name: z.string(),
  ownerId: z.string().min(1),
  state: z.string(),
  zipCode: z.string(),
});

const jobSchema = z.object({
  cancelledAt: dateStringSchema.nullable(),
  createdAt: dateStringSchema,
  description: z.string(),
  durationMinutes: z.number().int().positive(),
  filled: z.boolean(),
  id: z.string().min(1),
  local: jobLocalSchema,
  localId: z.string().min(1),
  startsAt: dateStringSchema,
  title: z.string(),
  value: z.string().regex(/^\d+(?:\.\d{1,2})?$/),
});

const acceptanceStatusSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('pending') }),
  z.object({ operatorId: z.string().min(1), status: z.literal('finished') }),
]);

async function listJobs(signal?: AbortSignal): Promise<Job[]> {
  const response = await httpClient.get<unknown>('/jobs', { signal });
  return parseApiResponse(z.array(jobSchema), response.data);
}

async function getJob(jobId: string, signal?: AbortSignal): Promise<Job> {
  const response = await httpClient.get<unknown>(`/jobs/${jobId}`, { signal });
  return parseApiResponse(jobSchema, response.data);
}

async function acceptJob(jobId: string): Promise<void> {
  await httpClient.post(`/jobs/${jobId}/accept`);
}

async function getJobAcceptanceStatus(
  jobId: string,
  signal?: AbortSignal,
): Promise<JobAcceptanceStatus> {
  const response = await httpClient.get<unknown>(`/jobs/${jobId}/accepted`, { signal });
  return parseApiResponse(acceptanceStatusSchema, response.data);
}

export { acceptJob, getJob, getJobAcceptanceStatus, listJobs };
