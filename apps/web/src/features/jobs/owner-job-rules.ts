import { getJobAvailability } from '@/features/jobs/job-rules';
import type { Job, JobAvailability } from '@/features/jobs/job-types';

type OwnerJobFilter = 'all' | JobAvailability;

type OwnerJobCounts = Record<JobAvailability, number> & { all: number };

function getOwnerJobCounts(jobs: Job[], now = new Date()): OwnerJobCounts {
  const counts: OwnerJobCounts = {
    all: jobs.length,
    available: 0,
    cancelled: 0,
    ended: 0,
    filled: 0,
  };

  jobs.forEach((job) => {
    counts[getJobAvailability(job, now)] += 1;
  });

  return counts;
}

function filterOwnerJobs(jobs: Job[], filter: OwnerJobFilter, now = new Date()): Job[] {
  return [...jobs]
    .filter((job) => filter === 'all' || getJobAvailability(job, now) === filter)
    .sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt));
}

export { filterOwnerJobs, getOwnerJobCounts };
export type { OwnerJobCounts, OwnerJobFilter };
