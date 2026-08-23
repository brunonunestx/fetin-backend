import { describe, expect, it } from 'vitest';
import {
  profileFormSchema,
  toUpdateProfileInput,
  validateProfileForRole,
} from '@/features/profile/profile-form-schema';

const validValues = {
  age: '34',
  bio: 'Experiência com reformas residenciais.',
  name: '  João da Silva  ',
  phone: '(35) 99999-9999',
  position: '  Pedreiro  ',
};

describe('profile form schema', () => {
  it('validates and normalizes the worker profile payload', () => {
    const values = profileFormSchema.parse(validValues);

    expect(validateProfileForRole(values, 'operator')).toBeNull();
    expect(toUpdateProfileInput(values, 'operator')).toEqual({
      age: 34,
      bio: validValues.bio,
      name: 'João da Silva',
      phone: '+5535999999999',
      position: 'Pedreiro',
    });
  });

  it('keeps worker-only fields out of a contractor payload', () => {
    const values = profileFormSchema.parse(validValues);

    expect(toUpdateProfileInput(values, 'local_owner')).toEqual({
      bio: validValues.bio,
      name: 'João da Silva',
      phone: '+5535999999999',
    });
  });

  it('rejects invalid age, phone and short professions', () => {
    const result = profileFormSchema.safeParse({
      ...validValues,
      age: '121',
      phone: '3599',
      position: 'P',
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors).toMatchObject({
      age: ['Digite uma idade entre 0 e 120.'],
      phone: ['Digite um telefone com DDD.'],
      position: ['A profissão precisa ter pelo menos 2 caracteres.'],
    });
  });

  it('requires a profession only when the account belongs to a worker', () => {
    const values = profileFormSchema.parse({ ...validValues, position: '' });

    expect(validateProfileForRole(values, 'operator')).toBe(
      'Informe sua profissão para continuar.',
    );
    expect(validateProfileForRole(values, 'local_owner')).toBeNull();
  });
});
