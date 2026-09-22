import { z } from 'zod';
import type { CreateLocationInput } from '@/features/locals/local-types';
import type { CurrentCoordinates } from '@/lib/geolocation';

function formatZipCode(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

const localFormSchema = z.object({
  address: z
    .string()
    .trim()
    .min(3, 'Digite o endereço completo.')
    .max(200, 'O endereço pode ter no máximo 200 caracteres.'),
  city: z
    .string()
    .trim()
    .min(2, 'Digite o nome da cidade.')
    .max(100, 'A cidade pode ter no máximo 100 caracteres.'),
  name: z
    .string()
    .trim()
    .min(2, 'O nome precisa ter pelo menos 2 caracteres.')
    .max(120, 'O nome pode ter no máximo 120 caracteres.'),
  state: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{2}$/, 'Digite a UF com duas letras. Por exemplo: MG.'),
  zipCode: z.string().regex(/^\d{5}-?\d{3}$/, 'Digite um CEP com 8 números.'),
});

type LocalFormValues = z.infer<typeof localFormSchema>;

function toCreateLocationInput(
  values: LocalFormValues,
  coordinates?: CurrentCoordinates,
): CreateLocationInput {
  const input = {
    address: values.address.trim(),
    city: values.city.trim(),
    name: values.name.trim(),
    state: values.state.trim().toUpperCase(),
    zipCode: formatZipCode(values.zipCode),
  };

  if (!coordinates) {
    return input;
  }

  return {
    ...input,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
  };
}

export { formatZipCode, localFormSchema, toCreateLocationInput };
export type { LocalFormValues };
