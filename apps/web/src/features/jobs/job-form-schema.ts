import { z } from 'zod';
import type { CreateJobInput } from '@/features/jobs/job-types';

function parseDecimal(value: string): number {
  return Number(value.replace(',', '.'));
}

function localDateTimeToIso(value: string): string {
  return new Date(value).toISOString();
}

function formatDateTimeLocalValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

const jobFormSchema = z.object({
  description: z
    .string()
    .trim()
    .min(10, 'Explique o trabalho em pelo menos 10 caracteres.')
    .max(2000, 'A descrição pode ter no máximo 2000 caracteres.'),
  durationHours: z
    .string()
    .trim()
    .refine((value) => {
      const hours = parseDecimal(value);
      return Number.isFinite(hours) && hours > 0 && Number.isInteger(hours * 60);
    }, 'Digite uma duração válida em horas.'),
  localId: z.uuid('Escolha onde o trabalho será realizado.'),
  startsAtLocal: z
    .string()
    .min(1, 'Escolha a data e o horário.')
    .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Escolha uma data válida.')
    .refine(
      (value) => new Date(value).getTime() > Date.now(),
      'Escolha uma data e horário futuros.',
    ),
  title: z
    .string()
    .trim()
    .min(3, 'O título precisa ter pelo menos 3 caracteres.')
    .max(120, 'O título pode ter no máximo 120 caracteres.'),
  value: z
    .string()
    .trim()
    .regex(/^\d+(?:[.,]\d{1,2})?$/, 'Digite um valor válido com até duas casas decimais.')
    .refine((value) => parseDecimal(value) > 0, 'O valor precisa ser maior que zero.'),
});

type JobFormValues = z.infer<typeof jobFormSchema>;

function toCreateJobInput(values: JobFormValues): CreateJobInput {
  return {
    description: values.description.trim(),
    durationMinutes: Math.round(parseDecimal(values.durationHours) * 60),
    localId: values.localId,
    startsAt: localDateTimeToIso(values.startsAtLocal),
    title: values.title.trim(),
    value: parseDecimal(values.value),
  };
}

export { formatDateTimeLocalValue, jobFormSchema, localDateTimeToIso, toCreateJobInput };
export type { JobFormValues };
