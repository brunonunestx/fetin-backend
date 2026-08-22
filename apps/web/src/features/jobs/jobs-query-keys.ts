const jobsQueryKeys = {
  acceptance: (jobId: string) => [...jobsQueryKeys.all, 'acceptance', jobId] as const,
  all: ['jobs'] as const,
  detail: (jobId: string) => [...jobsQueryKeys.details(), jobId] as const,
  details: () => [...jobsQueryKeys.all, 'detail'] as const,
  list: () => [...jobsQueryKeys.lists(), 'available'] as const,
  lists: () => [...jobsQueryKeys.all, 'list'] as const,
};

export { jobsQueryKeys };
