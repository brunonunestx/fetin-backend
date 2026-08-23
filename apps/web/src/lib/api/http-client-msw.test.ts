import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { ApiError } from '@/lib/api/api-error';
import { httpClient } from '@/lib/api/http-client';
import { mockServer } from '@/test/mock-server';

const apiBaseUrl = 'http://localhost:3000/api/testing';

describe('httpClient network scenarios with MSW', () => {
  it('handles a successful JSON response', async () => {
    mockServer.use(
      http.get(`${apiBaseUrl}/success`, () => HttpResponse.json({ message: 'Tudo certo' })),
    );

    await expect(httpClient.get('/testing/success')).resolves.toMatchObject({
      data: { message: 'Tudo certo' },
      status: 200,
    });
  });

  it('normalizes an API error and keeps its correlation id', async () => {
    mockServer.use(
      http.get(`${apiBaseUrl}/error`, () =>
        HttpResponse.json(
          {
            code: 'LOCAL_NOT_FOUND',
            correlationId: 'request-msw-123',
            message: 'Local not found',
            statusCode: 404,
          },
          { status: 404 },
        ),
      ),
    );

    await expect(httpClient.get('/testing/error')).rejects.toMatchObject({
      code: 'LOCAL_NOT_FOUND',
      correlationId: 'request-msw-123',
      message: 'Este local não foi encontrado.',
      statusCode: 404,
    } satisfies Partial<ApiError>);
  });

  it('keeps the request pending while the server is slow', async () => {
    mockServer.use(
      http.get(`${apiBaseUrl}/slow`, async () => {
        await delay(80);
        return HttpResponse.json({ message: 'Resposta concluída' });
      }),
    );
    let settled = false;
    const request = httpClient.get('/testing/slow').finally(() => {
      settled = true;
    });

    await Promise.resolve();
    expect(settled).toBe(false);
    await expect(request).resolves.toMatchObject({ data: { message: 'Resposta concluída' } });
  });

  it('turns a network failure into a useful offline error', async () => {
    mockServer.use(http.get(`${apiBaseUrl}/offline`, () => HttpResponse.error()));

    await expect(httpClient.get('/testing/offline')).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      message: 'Sem conexão com o servidor. Verifique sua internet e tente novamente.',
    } satisfies Partial<ApiError>);
  });
});
