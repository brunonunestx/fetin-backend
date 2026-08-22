const acceptedJobsQueryKeys = {
  all: ['accepted-jobs'] as const,
  list: () => [...acceptedJobsQueryKeys.all, 'list'] as const,
};

export { acceptedJobsQueryKeys };
