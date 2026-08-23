import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { updateJobInCaches } from '@/features/jobs/job-cache';
import { getJobAcceptanceStatus } from '@/features/jobs/jobs-api';
import { jobsQueryKeys } from '@/features/jobs/jobs-query-keys';

const OWNER_STATUS_POLL_INTERVAL_MS = 4_000;

function useOwnerJobStatus(jobId: string, enabled: boolean) {
  const queryClient = useQueryClient();
  const statusQuery = useQuery({
    enabled: Boolean(jobId) && enabled,
    queryFn: ({ signal }) => getJobAcceptanceStatus(jobId, signal),
    queryKey: jobsQueryKeys.acceptance(jobId),
    refetchInterval: (query) =>
      query.state.data?.status === 'finished' ? false : OWNER_STATUS_POLL_INTERVAL_MS,
  });

  useEffect(() => {
    if (statusQuery.data?.status !== 'finished') {
      return;
    }

    updateJobInCaches(queryClient, jobId, (job) => ({ ...job, filled: true }));
  }, [jobId, queryClient, statusQuery.data?.status]);

  return statusQuery;
}

export { useOwnerJobStatus };
