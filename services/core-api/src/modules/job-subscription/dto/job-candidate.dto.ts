import { JobCandidate } from '../../../generated/prisma/client';

export enum JobCandidateStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
}

export class JobCandidateDto {
  operatorId!: string;
  status!: JobCandidateStatus;
  createdAt!: Date;
}

const STATUS_MAP: Record<JobCandidate['status'], JobCandidateStatus> = {
  PENDING: JobCandidateStatus.PENDING,
  CONFIRMED: JobCandidateStatus.CONFIRMED,
  REJECTED: JobCandidateStatus.REJECTED,
};

export function toJobCandidateDto(candidate: JobCandidate): JobCandidateDto {
  return {
    operatorId: candidate.operatorId,
    status: STATUS_MAP[candidate.status],
    createdAt: candidate.createdAt,
  };
}
