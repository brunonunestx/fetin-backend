import type { JobSearchCoordinates } from '@/features/jobs/job-types';

const jobsQueryKeys = {
  acceptance: (jobId: string) => [...jobsQueryKeys.all, 'acceptance', jobId] as const,
  all: ['jobs'] as const,
  candidates: (jobId: string) => [...jobsQueryKeys.all, 'candidates', jobId] as const,
  detail: (jobId: string) => [...jobsQueryKeys.details(), jobId] as const,
  details: () => [...jobsQueryKeys.all, 'detail'] as const,
  localList: (localId: string) => [...jobsQueryKeys.lists(), 'local', localId] as const,
  ownerList: (ownerId: string) => [...jobsQueryKeys.lists(), 'owner', ownerId] as const,
  ownCandidate: (jobId: string) => [...jobsQueryKeys.all, 'candidate', 'own', jobId] as const,
  list: (coordinates?: JobSearchCoordinates) =>
    coordinates
      ? ([
          ...jobsQueryKeys.lists(),
          'available',
          'nearby',
          coordinates.latitude,
          coordinates.longitude,
        ] as const)
      : ([...jobsQueryKeys.lists(), 'available'] as const),
  lists: () => [...jobsQueryKeys.all, 'list'] as const,
};

export { jobsQueryKeys };
