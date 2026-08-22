import type { z } from 'zod';
import { ApiError } from '@/lib/api/api-error';

function parseApiResponse<TSchema extends z.ZodType>(
  schema: TSchema,
  data: unknown,
): z.infer<TSchema> {
  const parsedData = schema.safeParse(data);

  if (!parsedData.success) {
    throw new ApiError({
      code: 'INVALID_API_RESPONSE',
      message: 'O servidor enviou uma resposta inesperada. Tente novamente.',
    });
  }

  return parsedData.data;
}

export { parseApiResponse };
