import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { acceptedJobsQueryKeys } from '@/features/accepted-jobs/accepted-jobs-query-keys';
import { updateJobInCaches } from '@/features/jobs/job-cache';
import { acceptJob, getOwnJobCandidate } from '@/features/jobs/jobs-api';
import { jobsQueryKeys } from '@/features/jobs/jobs-query-keys';
import type { JobCandidate } from '@/features/jobs/job-types';
import { useOnlineStatus } from '@/lib/use-online-status';

const CANDIDATE_STATUS_POLL_INTERVAL_MS = 5_000;

type AcceptanceViewState =
  'applied' | 'checking' | 'error' | 'idle' | 'lost' | 'offline' | 'submitting' | 'won';

function useJobAcceptance(jobId: string, userId: string) {
  const isOnline = useOnlineStatus();
  const queryClient = useQueryClient();
  const ownCandidateQuery = useQuery({
    enabled: Boolean(jobId && userId),
    queryFn: ({ signal }) => getOwnJobCandidate(jobId, signal),
    queryKey: jobsQueryKeys.ownCandidate(jobId),
    refetchInterval: (query) =>
      query.state.data?.status === 'pending' ? CANDIDATE_STATUS_POLL_INTERVAL_MS : false,
    retry: false,
  });
  const acceptMutation = useMutation({
    mutationFn: () => acceptJob(jobId),
    onSuccess: () => {
      const candidate: JobCandidate = {
        createdAt: new Date().toISOString(),
        operatorId: userId,
        status: 'pending',
      };
      queryClient.setQueryData(jobsQueryKeys.ownCandidate(jobId), candidate);
    },
  });
  const candidateStatus = ownCandidateQuery.data?.status;

  useEffect(() => {
    if (candidateStatus !== 'confirmed' && candidateStatus !== 'rejected') {
      return;
    }

    updateJobInCaches(queryClient, jobId, (job) => ({ ...job, filled: true }));
    void queryClient.invalidateQueries({ queryKey: jobsQueryKeys.lists(), refetchType: 'none' });

    if (candidateStatus === 'confirmed') {
      void queryClient.invalidateQueries({ queryKey: acceptedJobsQueryKeys.all });
    }
  }, [candidateStatus, jobId, queryClient]);

  const submitAcceptance = () => {
    if (!isOnline || ownCandidateQuery.data) {
      return;
    }

    acceptMutation.mutate();
  };

  const tryAgain = () => {
    if (!isOnline) {
      return;
    }

    if (ownCandidateQuery.isError) {
      void ownCandidateQuery.refetch();
      return;
    }

    acceptMutation.mutate();
  };

  let state: AcceptanceViewState = 'idle';

  if (candidateStatus === 'pending') {
    state = 'applied';
  } else if (candidateStatus === 'confirmed') {
    state = 'won';
  } else if (candidateStatus === 'rejected') {
    state = 'lost';
  } else if (acceptMutation.isPending) {
    state = 'submitting';
  } else if (!isOnline) {
    state = 'offline';
  } else if (acceptMutation.isError || ownCandidateQuery.isError) {
    state = 'error';
  } else if (ownCandidateQuery.isPending) {
    state = 'checking';
  }

  return {
    error: acceptMutation.error ?? ownCandidateQuery.error,
    isOnline,
    state,
    submitAcceptance,
    tryAgain,
  };
}

export { useJobAcceptance };
export type { AcceptanceViewState };
