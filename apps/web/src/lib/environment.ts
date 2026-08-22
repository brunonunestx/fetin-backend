import { z } from 'zod';

const environmentSchema = z.object({
  VITE_API_URL: z.string().trim().min(1).default('/api'),
});

const parsedEnvironment = environmentSchema.safeParse(import.meta.env);

if (!parsedEnvironment.success) {
  throw new Error('As variáveis de ambiente do frontend são inválidas.');
}

export const environment = {
  apiUrl: parsedEnvironment.data.VITE_API_URL,
} as const;
