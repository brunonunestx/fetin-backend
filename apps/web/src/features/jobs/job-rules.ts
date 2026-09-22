import type { Job, JobAvailability } from '@/features/jobs/job-types';

function getJobAvailability(job: Job, now = new Date()): JobAvailability {
  if (job.cancelledAt) {
    return 'cancelled';
  }

  if (job.filled) {
    return 'filled';
  }

  if (new Date(job.startsAt).getTime() <= now.getTime()) {
    return 'ended';
  }

  return 'available';
}

function getAvailableJobs(
  jobs: Job[],
  now = new Date(),
  order: 'date' | 'distance' = 'date',
): Job[] {
  const availableJobs = jobs.filter((job) => getJobAvailability(job, now) === 'available');

  if (order === 'distance') {
    return availableJobs.sort(
      (first, second) =>
        (first.distanceKm ?? Number.POSITIVE_INFINITY) -
        (second.distanceKm ?? Number.POSITIVE_INFINITY),
    );
  }

  return availableJobs.sort(
    (first, second) => Date.parse(first.startsAt) - Date.parse(second.startsAt),
  );
}

function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('pt-BR');
}

function searchJobs(jobs: Job[], search: string): Job[] {
  const term = normalizeSearch(search);

  if (!term) {
    return jobs;
  }

  return jobs.filter((job) =>
    [job.title, job.description, job.local.city].some((value) =>
      normalizeSearch(value).includes(term),
    ),
  );
}

export { getAvailableJobs, getJobAvailability, searchJobs };
