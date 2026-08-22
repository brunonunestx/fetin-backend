import { describe, expect, it } from 'vitest';
import type { AcceptedJob } from '@/features/accepted-jobs/accepted-job-types';
import { groupAcceptedJobs } from '@/features/accepted-jobs/accepted-jobs-rules';

const baseJob: AcceptedJob = {
  acceptedAt: '2026-08-22T12:00:00.000Z',
  cancelledAt: null,
  description: 'Preparar e pintar duas paredes da sala.',
  durationMinutes: 240,
  jobId: 'job-1',
  local: {
    address: 'Rua das Flores, 120',
    city: 'Pouso Alegre',
    id: 'local-1',
    name: 'Casa da Maria',
    ownerId: 'owner-1',
    state: 'MG',
    zipCode: '37550-000',
  },
  localId: 'local-1',
  startsAt: '2026-09-15T12:00:00.000Z',
  title: 'Pintura residencial',
  value: '180.50',
};

describe('accepted jobs rules', () => {
  it('groups active future work separately and sorts each group by relevance', () => {
    const now = new Date('2026-09-01T12:00:00.000Z');
    const nearestUpcoming = { ...baseJob, jobId: 'upcoming-1' };
    const laterUpcoming = {
      ...baseJob,
      jobId: 'upcoming-2',
      startsAt: '2026-09-20T12:00:00.000Z',
    };
    const recentPrevious = {
      ...baseJob,
      jobId: 'previous-1',
      startsAt: '2026-08-30T12:00:00.000Z',
    };
    const olderPrevious = {
      ...baseJob,
      jobId: 'previous-2',
      startsAt: '2026-08-20T12:00:00.000Z',
    };

    expect(
      groupAcceptedJobs([olderPrevious, laterUpcoming, recentPrevious, nearestUpcoming], now),
    ).toEqual({
      previous: [recentPrevious, olderPrevious],
      upcoming: [nearestUpcoming, laterUpcoming],
    });
  });

  it('keeps a cancelled future job in the previous history', () => {
    const cancelledJob = {
      ...baseJob,
      cancelledAt: '2026-08-30T12:00:00.000Z',
    };

    expect(groupAcceptedJobs([cancelledJob], new Date('2026-09-01T12:00:00.000Z'))).toEqual({
      previous: [cancelledJob],
      upcoming: [],
    });
  });
});
