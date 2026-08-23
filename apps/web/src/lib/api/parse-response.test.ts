import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ApiError } from '@/lib/api/api-error';
import { parseApiResponse } from '@/lib/api/parse-response';

const responseSchema = z.object({ id: z.string().uuid(), name: z.string().min(1) });

describe('parseApiResponse', () => {
  it('returns data that matches the contract', () => {
    const payload = {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Maria',
    };

    expect(parseApiResponse(responseSchema, payload)).toEqual(payload);
  });

  it('rejects malformed API data without exposing validation internals', () => {
    expect(() => parseApiResponse(responseSchema, { id: 123 })).toThrowError(
      expect.objectContaining({
        code: 'INVALID_API_RESPONSE',
        message: 'O servidor enviou uma resposta inesperada. Tente novamente.',
      }) as ApiError,
    );
  });
});
