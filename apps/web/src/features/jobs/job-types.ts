type JobLocal = {
  address: string;
  city: string;
  id: string;
  name: string;
  ownerId: string;
  state: string;
  zipCode: string;
};

type Job = {
  cancelledAt: string | null;
  createdAt: string;
  description: string;
  durationMinutes: number;
  filled: boolean;
  id: string;
  local: JobLocal;
  localId: string;
  startsAt: string;
  title: string;
  value: string;
};

type JobAcceptanceStatus = { status: 'pending' } | { operatorId: string; status: 'finished' };

type JobAvailability = 'available' | 'cancelled' | 'ended' | 'filled';

export type { Job, JobAcceptanceStatus, JobAvailability, JobLocal };
