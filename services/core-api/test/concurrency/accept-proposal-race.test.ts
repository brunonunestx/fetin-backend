// Teste de concorrência: N operadores tentando aceitar a mesma vaga
// simultaneamente, via POST /vagas/:id/aceitar.
//
// Mesmo cenário do test/k6/accept-proposal-race.test.js (concorrência real,
// não mockada, contra a API já de pé via docker-compose), rodável com
// `pnpm test:concurrency` — sem precisar instalar o k6.
//
// A API enfileira o aceite (BullMQ) e responde de forma otimista, então a
// disputa em si (lock Redis + unique constraint no Postgres) é resolvida
// assincronamente pelo worker. Aqui confirmamos o resultado tanto pela rota
// GET /vagas/:id/aceito quanto por uma leitura direta na tabela
// job_subscriptions, provando que existe exatamente 1 confirmação.
import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { afterAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '../../src/generated/prisma/client';

const BASE_URL = 'http://localhost:3000';
const DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://user:password@localhost:5432/core_api?schema=public';

const OPERATORS_COUNT = 100;
const POLL_TIMEOUT_MS = 15_000;
const POLL_INTERVAL_MS = 500;

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: DATABASE_URL }),
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function scheduleAccept(jobId: string, operatorId: string) {
  return fetch(`${BASE_URL}/vagas/${jobId}/aceitar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operatorId }),
  });
}

async function waitForWinner(
  jobId: string,
): Promise<{ status: string; operatorId: string } | null> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const res = await fetch(`${BASE_URL}/vagas/${jobId}/aceito`);
    const body = (await res.json()) as { status: string; operatorId: string };

    if (body.status === 'finished') {
      return body;
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  return null;
}

describe('POST /vagas/:id/aceitar — corrida de aceite', () => {
  it(`resolve a disputa entre ${OPERATORS_COUNT} operadores concorrentes com exatamente 1 confirmação`, async () => {
    const jobId = randomUUID();
    const operatorIds = Array.from({ length: OPERATORS_COUNT }, () =>
      randomUUID(),
    );

    const responses = await Promise.all(
      operatorIds.map((operatorId) => scheduleAccept(jobId, operatorId)),
    );

    for (const res of responses) {
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(300);
    }

    const winner = await waitForWinner(jobId);
    expect(winner, 'corrida não resolveu dentro do timeout').not.toBeNull();
    expect(operatorIds).toContain(winner!.operatorId);

    const subscriptions = await prisma.jobSubscription.findMany({
      where: { jobId },
    });

    expect(subscriptions).toHaveLength(1);
    expect(subscriptions[0].operatorId).toBe(winner!.operatorId);
  });
});
