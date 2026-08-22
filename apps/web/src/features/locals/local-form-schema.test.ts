import { describe, expect, it } from 'vitest';
import {
  formatZipCode,
  localFormSchema,
  toCreateLocationInput,
} from '@/features/locals/local-form-schema';

describe('local form schema', () => {
  it('formats a CEP while the contractor types', () => {
    expect(formatZipCode('37550000')).toBe('37550-000');
    expect(formatZipCode('37.550-0009')).toBe('37550-000');
  });

  it('validates all required fields and normalizes the API payload', () => {
    const values = localFormSchema.parse({
      address: ' Rua das Flores, 120 ',
      city: ' Pouso Alegre ',
      name: ' Padaria Central ',
      state: 'mg',
      zipCode: '37550000',
    });

    expect(toCreateLocationInput(values)).toEqual({
      address: 'Rua das Flores, 120',
      city: 'Pouso Alegre',
      name: 'Padaria Central',
      state: 'MG',
      zipCode: '37550-000',
    });
  });

  it('rejects invalid UF and CEP values', () => {
    const result = localFormSchema.safeParse({
      address: 'Rua A, 10',
      city: 'Itajubá',
      name: 'Loja',
      state: 'Minas Gerais',
      zipCode: '1234',
    });

    expect(result.success).toBe(false);
  });
});
