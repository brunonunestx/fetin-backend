import { describe, expect, it } from 'vitest';
import type { Job } from '@/features/jobs/job-types';
import { filterOwnerJobs, getOwnerJobCounts } from '@/features/jobs/owner-job-rules';

const baseJob: Job = {
  cancelledAt: null,
  createdAt: '2026-08-22T12:00:00.000Z',
  description: 'Ajudar na organização do estoque da padaria.',
  durationMinutes: 240,
  filled: false,
  id: 'job-1',
  local: {
    address: 'Rua das Flores, 120',
    city: 'Pouso Alegre',
    id: 'local-1',
    name: 'Padaria Central',
    ownerId: 'owner-1',
    state: 'MG',
    zipCode: '37550-000',
  },
  localId: 'local-1',
  startsAt: '2026-09-15T12:00:00.000Z',
  title: 'Organizar estoque',
  value: '180.50',
};

describe('contractor job rules', () => {
  it('counts open, filled, cancelled and ended jobs separately', () => {
    const jobs = [
      baseJob,
      { ...baseJob, filled: true, id: 'filled' },
      { ...baseJob, cancelledAt: '2026-08-30T12:00:00.000Z', id: 'cancelled' },
      { ...baseJob, id: 'ended', startsAt: '2026-08-20T12:00:00.000Z' },
    ];

    expect(getOwnerJobCounts(jobs, new Date('2026-09-01T12:00:00.000Z'))).toEqual({
      all: 4,
      available: 1,
      cancelled: 1,
      ended: 1,
      filled: 1,
    });
  });

  it('filters by status and shows the newest publications first', () => {
    const older = { ...baseJob, createdAt: '2026-08-20T12:00:00.000Z', id: 'older' };
    const newer = { ...baseJob, createdAt: '2026-08-24T12:00:00.000Z', id: 'newer' };

    expect(
      filterOwnerJobs([older, newer], 'available', new Date('2026-09-01T12:00:00.000Z')),
    ).toEqual([newer, older]);
  });
});
