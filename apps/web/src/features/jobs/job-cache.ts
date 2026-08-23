import type { QueryClient } from '@tanstack/react-query';
import { getJobAvailability } from '@/features/jobs/job-rules';
import { jobsQueryKeys } from '@/features/jobs/jobs-query-keys';
import type { Job } from '@/features/jobs/job-types';

function prependJob(jobs: Job[] | undefined, job: Job): Job[] {
  if (!jobs) {
    return [job];
  }

  return jobs.some((currentJob) => currentJob.id === job.id) ? jobs : [job, ...jobs];
}

function addJobToCaches(queryClient: QueryClient, job: Job, ownerId: string) {
  queryClient.setQueryData(jobsQueryKeys.detail(job.id), job);
  queryClient.setQueryData<Job[]>(jobsQueryKeys.ownerList(ownerId), (jobs) =>
    prependJob(jobs, job),
  );
  queryClient.setQueryData<Job[]>(jobsQueryKeys.localList(job.localId), (jobs) =>
    prependJob(jobs, job),
  );

  if (getJobAvailability(job) === 'available') {
    queryClient.setQueryData<Job[]>(jobsQueryKeys.list(), (jobs) => prependJob(jobs, job));
  }
}

function updateJobInCaches(queryClient: QueryClient, jobId: string, update: (job: Job) => Job) {
  queryClient.setQueryData<Job>(jobsQueryKeys.detail(jobId), (job) => (job ? update(job) : job));
  queryClient.setQueriesData<Job[]>({ queryKey: jobsQueryKeys.lists() }, (jobs) =>
    jobs?.map((job) => (job.id === jobId ? update(job) : job)),
  );
}

export { addJobToCaches, updateJobInCaches };
