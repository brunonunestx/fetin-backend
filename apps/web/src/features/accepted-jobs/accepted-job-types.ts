import type { JobLocal } from '@/features/jobs/job-types';

type AcceptedJob = {
  acceptedAt: string;
  cancelledAt: string | null;
  description: string;
  durationMinutes: number;
  jobId: string;
  local: JobLocal;
  localId: string;
  startsAt: string;
  title: string;
  value: string;
};

type AcceptedJobGroups = {
  previous: AcceptedJob[];
  upcoming: AcceptedJob[];
};

export type { AcceptedJob, AcceptedJobGroups };
