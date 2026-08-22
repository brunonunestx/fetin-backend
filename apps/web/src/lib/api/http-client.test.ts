import AxiosMockAdapter from 'axios-mock-adapter';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ApiError } from '@/lib/api/api-error';
import { httpClient } from '@/lib/api/http-client';
import { sessionStore } from '@/lib/session-store';

describe('httpClient', () => {
  let mock: AxiosMockAdapter;

  beforeEach(() => {
    mock = new AxiosMockAdapter(httpClient);
  });

  afterEach(() => {
    mock.restore();
  });

  it('adds the stored Bearer token to requests', async () => {
    sessionStore.setAccessToken('access-token');
    mock.onGet('/protected').reply((config) => {
      expect(config.headers?.Authorization).toBe('Bearer access-token');
      return [200, { ok: true }];
    });

    await expect(httpClient.get('/protected')).resolves.toMatchObject({ status: 200 });
  });

  it('normalizes validation errors and preserves the correlation id', async () => {
    mock.onPost('/auth/register').reply(400, {
      code: 'BadRequestException',
      correlationId: 'request-123',
      message: ['email must be an email'],
      statusCode: 400,
    });

    await expect(httpClient.post('/auth/register', {})).rejects.toMatchObject({
      code: 'BadRequestException',
      correlationId: 'request-123',
      message: 'Digite um e-mail válido.',
      statusCode: 400,
    } satisfies Partial<ApiError>);
  });

  it('clears the session after an unauthorized protected request', async () => {
    sessionStore.setAccessToken('expired-token');
    mock.onGet('/auth/me').reply(401, {
      code: 'INVALID_TOKEN',
      message: 'Token inválido',
      statusCode: 401,
    });

    await expect(httpClient.get('/auth/me')).rejects.toBeInstanceOf(ApiError);
    expect(sessionStore.getAccessToken()).toBeNull();
  });
});
