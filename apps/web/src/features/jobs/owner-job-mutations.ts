import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addJobToCaches, updateJobInCaches } from '@/features/jobs/job-cache';
import { cancelJob, confirmJobCandidate, createJob } from '@/features/jobs/jobs-api';
import { jobsQueryKeys } from '@/features/jobs/jobs-query-keys';
import type { CreateJobInput, Job } from '@/features/jobs/job-types';
import type { WorkLocation } from '@/features/locals/local-types';

type CreateJobVariables = {
  input: CreateJobInput;
  location: WorkLocation;
};

function useCreateJobMutation(ownerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input }: CreateJobVariables) => createJob(input),
    onSuccess: (createdJob, { location }) => {
      const job: Job = { ...createdJob, filled: false, local: location };
      addJobToCaches(queryClient, job, ownerId);
    },
  });
}

function useCancelJobMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => cancelJob(jobId),
    onSuccess: (cancelledJob) => {
      updateJobInCaches(queryClient, cancelledJob.id, (job) => ({
        ...job,
        cancelledAt: cancelledJob.cancelledAt,
      }));
    },
  });
}

function useConfirmCandidateMutation(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (operatorId: string) => confirmJobCandidate(jobId, operatorId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: jobsQueryKeys.candidates(jobId) }),
        queryClient.invalidateQueries({ queryKey: jobsQueryKeys.acceptance(jobId) }),
      ]);
    },
  });
}

export { useCancelJobMutation, useConfirmCandidateMutation, useCreateJobMutation };
