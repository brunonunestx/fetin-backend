import { describe, expect, it } from 'vitest';
import {
  formatDateTimeLocalValue,
  jobFormSchema,
  localDateTimeToIso,
  toCreateJobInput,
} from '@/features/jobs/job-form-schema';

const localId = '11111111-1111-4111-8111-111111111111';

describe('job publication schema', () => {
  it('converts the device local date to ISO without a fixed timezone', () => {
    const localValue = '2099-09-15T09:30';

    expect(localDateTimeToIso(localValue)).toBe(new Date(localValue).toISOString());
  });

  it('formats a Date using its local calendar values', () => {
    const date = new Date(2099, 8, 15, 9, 5);

    expect(formatDateTimeLocalValue(date)).toBe('2099-09-15T09:05');
  });

  it('normalizes hours and Brazilian decimal payment for the API', () => {
    const values = jobFormSchema.parse({
      description: 'Carregar e organizar os sacos no depósito.',
      durationHours: '2,5',
      localId,
      startsAtLocal: '2099-09-15T09:30',
      title: 'Organizar depósito',
      value: '180,50',
    });

    expect(toCreateJobInput(values)).toEqual({
      description: 'Carregar e organizar os sacos no depósito.',
      durationMinutes: 150,
      localId,
      startsAt: new Date('2099-09-15T09:30').toISOString(),
      title: 'Organizar depósito',
      value: 180.5,
    });
  });

  it('rejects past dates, empty work descriptions and invalid payments', () => {
    expect(
      jobFormSchema.safeParse({
        description: 'Curta',
        durationHours: '0',
        localId: '',
        startsAtLocal: '2020-01-01T08:00',
        title: 'Oi',
        value: '0',
      }).success,
    ).toBe(false);
  });
});
