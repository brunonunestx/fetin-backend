import { describe, expect, it } from 'vitest';
import { getAvailableJobs, getJobAvailability, searchJobs } from '@/features/jobs/job-rules';
import type { Job } from '@/features/jobs/job-types';

const baseJob: Job = {
  cancelledAt: null,
  createdAt: '2026-08-22T12:00:00.000Z',
  description: 'Preparar e pintar duas paredes da sala.',
  durationMinutes: 240,
  filled: false,
  id: 'job-1',
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

describe('job rules', () => {
  it('keeps only available jobs and sorts the closest date first', () => {
    const now = new Date('2026-09-01T12:00:00.000Z');
    const laterJob = { ...baseJob, id: 'later', startsAt: '2026-09-20T12:00:00.000Z' };
    const cancelledJob = { ...baseJob, cancelledAt: '2026-08-30T12:00:00.000Z', id: 'cancelled' };
    const filledJob = { ...baseJob, filled: true, id: 'filled' };
    const endedJob = { ...baseJob, id: 'ended', startsAt: '2026-08-31T12:00:00.000Z' };

    expect(getAvailableJobs([laterJob, cancelledJob, filledJob, endedJob, baseJob], now)).toEqual([
      baseJob,
      laterJob,
    ]);
    expect(getJobAvailability(cancelledJob, now)).toBe('cancelled');
    expect(getJobAvailability(filledJob, now)).toBe('filled');
    expect(getJobAvailability(endedJob, now)).toBe('ended');
  });

  it('searches title, profession description and city without accent sensitivity', () => {
    const bricklayerJob = {
      ...baseJob,
      description: 'Serviço para pedreiro com experiência.',
      id: 'job-2',
      title: 'Levantar um muro',
    };

    expect(searchJobs([baseJob, bricklayerJob], 'pintura')).toEqual([baseJob]);
    expect(searchJobs([baseJob, bricklayerJob], 'PEDREIRO')).toEqual([bricklayerJob]);
    expect(searchJobs([baseJob, bricklayerJob], 'pouso')).toEqual([baseJob, bricklayerJob]);
  });
});
