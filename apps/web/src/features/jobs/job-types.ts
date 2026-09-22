type JobLocal = {
  address: string;
  city: string;
  id: string;
  latitude: number | null;
  longitude: number | null;
  name: string;
  ownerId: string;
  state: string;
  zipCode: string;
};

type Job = {
  cancelledAt: string | null;
  createdAt: string;
  description: string;
  distanceKm?: number;
  durationMinutes: number;
  filled: boolean;
  id: string;
  local: JobLocal;
  localId: string;
  startsAt: string;
  title: string;
  value: string;
};

type JobSearchCoordinates = {
  latitude: number;
  longitude: number;
};

type JobCandidateStatus = 'confirmed' | 'pending' | 'rejected';

type JobCandidate = {
  createdAt: string;
  operatorId: string;
  status: JobCandidateStatus;
};

type CreateJobInput = Pick<
  Job,
  'description' | 'durationMinutes' | 'localId' | 'startsAt' | 'title'
> & {
  value: number;
};

type JobMutationResult = Omit<Job, 'filled' | 'local'>;

type JobAcceptanceStatus = { status: 'pending' } | { operatorId: string; status: 'finished' };

type JobAvailability = 'available' | 'cancelled' | 'ended' | 'filled';

export type {
  CreateJobInput,
  Job,
  JobAcceptanceStatus,
  JobAvailability,
  JobCandidate,
  JobCandidateStatus,
  JobLocal,
  JobMutationResult,
  JobSearchCoordinates,
};
