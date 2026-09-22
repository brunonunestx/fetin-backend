import { z } from 'zod';
import type {
  CreateJobInput,
  Job,
  JobAcceptanceStatus,
  JobCandidate,
  JobMutationResult,
  JobSearchCoordinates,
} from '@/features/jobs/job-types';
import { httpClient } from '@/lib/api/http-client';
import { parseApiResponse } from '@/lib/api/parse-response';

const dateStringSchema = z.string().refine((value) => !Number.isNaN(Date.parse(value)));

const jobLocalSchema = z.object({
  address: z.string(),
  city: z.string(),
  id: z.string().min(1),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  name: z.string(),
  ownerId: z.string().min(1),
  state: z.string(),
  zipCode: z.string(),
});

const jobSchema = z.object({
  cancelledAt: dateStringSchema.nullable(),
  createdAt: dateStringSchema,
  description: z.string(),
  distanceKm: z.number().nonnegative().optional(),
  durationMinutes: z.number().int().positive(),
  filled: z.boolean(),
  id: z.string().min(1),
  local: jobLocalSchema,
  localId: z.string().min(1),
  startsAt: dateStringSchema,
  title: z.string(),
  value: z.string().regex(/^\d+(?:\.\d{1,2})?$/),
});

const jobMutationResultSchema = jobSchema.omit({ filled: true, local: true });

const acceptanceStatusSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('pending') }),
  z.object({ operatorId: z.string().min(1), status: z.literal('finished') }),
]);

const jobCandidateSchema = z.object({
  createdAt: dateStringSchema,
  operatorId: z.string().min(1),
  status: z.enum(['confirmed', 'pending', 'rejected']),
});

async function listJobs({
  coordinates,
  localId,
  signal,
}: {
  coordinates?: JobSearchCoordinates;
  localId?: string;
  signal?: AbortSignal;
} = {}): Promise<Job[]> {
  const response = await httpClient.get<unknown>('/jobs', {
    params:
      localId || coordinates
        ? {
            ...(coordinates
              ? { lat: coordinates.latitude, lng: coordinates.longitude }
              : undefined),
            ...(localId ? { localId } : undefined),
          }
        : undefined,
    signal,
  });
  return parseApiResponse(z.array(jobSchema), response.data);
}

async function getJob(jobId: string, signal?: AbortSignal): Promise<Job> {
  const response = await httpClient.get<unknown>(`/jobs/${jobId}`, { signal });
  return parseApiResponse(jobSchema, response.data);
}

async function acceptJob(jobId: string): Promise<void> {
  await httpClient.post(`/jobs/${jobId}/accept`);
}

async function getOwnJobCandidate(
  jobId: string,
  signal?: AbortSignal,
): Promise<JobCandidate | null> {
  const response = await httpClient.get<unknown>(`/jobs/${jobId}/candidates/me`, { signal });
  return parseApiResponse(jobCandidateSchema.nullable(), response.data);
}

async function listJobCandidates(jobId: string, signal?: AbortSignal): Promise<JobCandidate[]> {
  const response = await httpClient.get<unknown>(`/jobs/${jobId}/candidates`, { signal });
  return parseApiResponse(z.array(jobCandidateSchema), response.data);
}

async function confirmJobCandidate(jobId: string, operatorId: string): Promise<void> {
  await httpClient.post(`/jobs/${jobId}/candidates/${operatorId}/confirm`);
}

async function getJobAcceptanceStatus(
  jobId: string,
  signal?: AbortSignal,
): Promise<JobAcceptanceStatus> {
  const response = await httpClient.get<unknown>(`/jobs/${jobId}/accepted`, { signal });
  return parseApiResponse(acceptanceStatusSchema, response.data);
}

async function createJob(input: CreateJobInput): Promise<JobMutationResult> {
  const response = await httpClient.post<unknown>('/jobs', input);
  return parseApiResponse(jobMutationResultSchema, response.data);
}

async function cancelJob(jobId: string): Promise<JobMutationResult> {
  const response = await httpClient.patch<unknown>(`/jobs/${jobId}/cancel`);
  return parseApiResponse(jobMutationResultSchema, response.data);
}

export {
  acceptJob,
  cancelJob,
  confirmJobCandidate,
  createJob,
  getJob,
  getJobAcceptanceStatus,
  getOwnJobCandidate,
  listJobCandidates,
  listJobs,
};
