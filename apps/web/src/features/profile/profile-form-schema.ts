import { z } from 'zod';
import type { UserType } from '@/features/auth/auth-types';
import { formatPhone, isValidPhone, normalizePhone } from '@/features/profile/profile-formatters';
import type { UpdateProfileInput, UserProfile } from '@/features/profile/profile-types';

const requiredText = (label: string) =>
  z
    .string()
    .trim()
    .min(2, `${label} precisa ter pelo menos 2 caracteres.`)
    .max(120, `${label} pode ter no máximo 120 caracteres.`);

const profileFormSchema = z
  .object({
    age: z
      .string()
      .trim()
      .refine(
        (value) => value === '' || (/^\d{1,3}$/.test(value) && Number(value) <= 120),
        'Digite uma idade entre 0 e 120.',
      ),
    bio: z.string().trim().max(500, 'A apresentação pode ter no máximo 500 caracteres.'),
    name: requiredText('O nome'),
    phone: z.string().refine(isValidPhone, 'Digite um telefone com DDD.'),
    position: z.string().trim().max(120, 'A profissão pode ter no máximo 120 caracteres.'),
  })
  .superRefine((values, context) => {
    if (values.position && values.position.length < 2) {
      context.addIssue({
        code: 'custom',
        message: 'A profissão precisa ter pelo menos 2 caracteres.',
        path: ['position'],
      });
    }
  });

type ProfileFormValues = z.infer<typeof profileFormSchema>;

function getProfileFormValues(profile: UserProfile): ProfileFormValues {
  return {
    age: profile.age === null ? '' : String(profile.age),
    bio: profile.bio ?? '',
    name: profile.name ?? '',
    phone: formatPhone(profile.phone ?? ''),
    position: profile.position ?? '',
  };
}

function validateProfileForRole(values: ProfileFormValues, type: UserType): string | null {
  return type === 'operator' && values.position.trim().length < 2
    ? 'Informe sua profissão para continuar.'
    : null;
}

function toUpdateProfileInput(values: ProfileFormValues, type: UserType): UpdateProfileInput {
  const input: UpdateProfileInput = {
    bio: values.bio.trim(),
    name: values.name.trim(),
    phone: normalizePhone(values.phone),
  };

  if (type === 'operator') {
    input.position = values.position.trim();

    if (values.age !== '') {
      input.age = Number(values.age);
    }
  }

  return input;
}

export { getProfileFormValues, profileFormSchema, toUpdateProfileInput, validateProfileForRole };
export type { ProfileFormValues };
