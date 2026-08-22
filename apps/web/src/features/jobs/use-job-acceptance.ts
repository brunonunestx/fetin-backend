import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { acceptJob, getJobAcceptanceStatus } from '@/features/jobs/jobs-api';
import { jobsQueryKeys } from '@/features/jobs/jobs-query-keys';
import type { Job } from '@/features/jobs/job-types';
import { useOnlineStatus } from '@/lib/use-online-status';

const POLL_INTERVAL_MS = 1_500;
const POLL_TIMEOUT_MS = 15_000;

type AcceptanceViewState =
  'confirming' | 'delayed' | 'error' | 'idle' | 'lost' | 'offline' | 'submitting' | 'won';

type PollMode = 'delayed' | 'idle' | 'paused' | 'polling';

function useJobAcceptance(jobId: string, userId: string) {
  const isOnline = useOnlineStatus();
  const queryClient = useQueryClient();
  const [pollMode, setPollMode] = useState<PollMode>('idle');
  const [wasScheduled, setWasScheduled] = useState(false);
  const isPolling = pollMode === 'polling';

  const statusQuery = useQuery({
    enabled: isPolling && isOnline,
    queryFn: ({ signal }) => getJobAcceptanceStatus(jobId, signal),
    queryKey: jobsQueryKeys.acceptance(jobId),
    refetchInterval: (query) =>
      isPolling && query.state.data?.status !== 'finished' && query.state.status !== 'error'
        ? POLL_INTERVAL_MS
        : false,
    retry: false,
  });

  const acceptMutation = useMutation({
    mutationFn: () => acceptJob(jobId),
    onSuccess: () => {
      setWasScheduled(true);
      queryClient.removeQueries({ queryKey: jobsQueryKeys.acceptance(jobId) });
      setPollMode(isOnline ? 'polling' : 'paused');
    },
  });

  useEffect(() => {
    const pausePolling = () => {
      void queryClient.cancelQueries({ queryKey: jobsQueryKeys.acceptance(jobId) });
      setPollMode((currentMode) => (currentMode === 'polling' ? 'paused' : currentMode));
    };

    window.addEventListener('offline', pausePolling);

    return () => {
      window.removeEventListener('offline', pausePolling);
      void queryClient.cancelQueries({ queryKey: jobsQueryKeys.acceptance(jobId) });
    };
  }, [jobId, queryClient]);

  useEffect(() => {
    if (!isPolling || statusQuery.data?.status === 'finished') {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void queryClient.cancelQueries({ queryKey: jobsQueryKeys.acceptance(jobId) });
      setPollMode('delayed');
    }, POLL_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [isPolling, jobId, queryClient, statusQuery.data?.status]);

  useEffect(() => {
    if (statusQuery.data?.status !== 'finished') {
      return;
    }

    queryClient.setQueryData<Job>(jobsQueryKeys.detail(jobId), (job) =>
      job ? { ...job, filled: true } : job,
    );
    queryClient.setQueriesData<Job[]>({ queryKey: jobsQueryKeys.lists() }, (jobs) =>
      jobs?.map((job) => (job.id === jobId ? { ...job, filled: true } : job)),
    );
    void queryClient.invalidateQueries({ queryKey: jobsQueryKeys.lists(), refetchType: 'none' });
  }, [jobId, queryClient, statusQuery.data?.status]);

  const submitAcceptance = () => {
    if (!isOnline) {
      setPollMode('paused');
      return;
    }

    acceptMutation.mutate();
  };

  const tryAgain = () => {
    if (!isOnline) {
      setPollMode('paused');
      return;
    }

    if (wasScheduled) {
      setPollMode('polling');
      void statusQuery.refetch();
      return;
    }

    acceptMutation.mutate();
  };

  let state: AcceptanceViewState = 'idle';

  if (acceptMutation.isPending) {
    state = 'submitting';
  } else if (acceptMutation.isError) {
    state = 'error';
  } else if (wasScheduled) {
    if (!isOnline || pollMode === 'paused') {
      state = 'offline';
    } else if (statusQuery.data?.status === 'finished') {
      state = statusQuery.data.operatorId === userId ? 'won' : 'lost';
    } else if (pollMode === 'delayed') {
      state = 'delayed';
    } else if (statusQuery.isError && !statusQuery.isFetching) {
      state = 'error';
    } else {
      state = 'confirming';
    }
  }

  return {
    error: acceptMutation.error ?? statusQuery.error,
    isOnline,
    state,
    submitAcceptance,
    tryAgain,
  };
}

export { useJobAcceptance };
export type { AcceptanceViewState };
