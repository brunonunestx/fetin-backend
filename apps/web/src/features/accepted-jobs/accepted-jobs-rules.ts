import type { AcceptedJob, AcceptedJobGroups } from '@/features/accepted-jobs/accepted-job-types';

function groupAcceptedJobs(jobs: AcceptedJob[], now = new Date()): AcceptedJobGroups {
  const upcoming: AcceptedJob[] = [];
  const previous: AcceptedJob[] = [];

  jobs.forEach((job) => {
    const isUpcoming = !job.cancelledAt && new Date(job.startsAt).getTime() > now.getTime();
    (isUpcoming ? upcoming : previous).push(job);
  });

  upcoming.sort((first, second) => Date.parse(first.startsAt) - Date.parse(second.startsAt));
  previous.sort((first, second) => Date.parse(second.startsAt) - Date.parse(first.startsAt));

  return { previous, upcoming };
}

export { groupAcceptedJobs };
