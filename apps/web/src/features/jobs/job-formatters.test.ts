import { describe, expect, it } from 'vitest';
import {
  formatAddress,
  formatCurrency,
  formatDistance,
  formatDuration,
} from '@/features/jobs/job-formatters';

describe('job formatters', () => {
  it('formats the value and duration for a Brazilian audience', () => {
    expect(formatCurrency('180.50')).toMatch(/R\$\s180,50/);
    expect(formatDuration(150)).toBe('2 horas e 30 minutos');
    expect(formatDuration(60)).toBe('1 hora');
  });

  it('joins all address information in one readable line', () => {
    expect(
      formatAddress({
        address: 'Rua das Flores, 120',
        city: 'Pouso Alegre',
        state: 'MG',
        zipCode: '37550-000',
      }),
    ).toBe('Rua das Flores, 120 — Pouso Alegre/MG · CEP 37550-000');
  });

  it('formats nearby distances without unnecessary precision', () => {
    expect(formatDistance(0.82)).toBe('A menos de 1 km');
    expect(formatDistance(2.36)).toBe('A 2,4 km');
    expect(formatDistance(12)).toBe('A 12 km');
  });
});
