// Teste de concorrência: 100 operadores tentando aceitar a mesma proposta
// (vaga) simultaneamente, via POST /vagas/:id/agendar.
//
// A API enfileira o aceite (BullMQ) e responde de forma otimista, então
// as 100 requisições concorrentes só validam a camada HTTP (devem ser
// aceitas com sucesso). A disputa em si (lock Redis + unique constraint no
// Postgres) é resolvida de forma assíncrona pelo worker — o resultado é
// conferido no teardown via GET /vagas/:id/agendado, que expõe o vencedor.
//
// Uso:
//   k6 run test/k6/accept-proposal-race.test.js
//   k6 run -e BASE_URL=http://localhost:3000 -e JOB_ID=<uuid> test/k6/accept-proposal-race.test.js

import { check } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { uuidv4 } from '../helpers/uuid.js';
import { JOB_ID } from '../helpers/config.js';
import { scheduleAccept, checkAccepted } from '../helpers/schedule.js';
import { waitForWinner } from '../helpers/accept-status.js';

const VUS = 100;

const acceptedRequests = new Counter('accepted_requests');
const failedRequests = new Counter('failed_requests');
const acceptDuration = new Trend('accept_duration', true);

export const options = {
  scenarios: {
    concurrent_accept: {
      executor: 'per-vu-iterations',
      vus: VUS,
      iterations: 1,
      maxDuration: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
};

export function setup() {
  const jobId = JOB_ID || uuidv4();
  console.log(`[setup] jobId em disputa (${VUS} operadores concorrentes): ${jobId}`);
  return { jobId };
}

export default function (data) {
  const operatorId = uuidv4();
  const res = scheduleAccept(data.jobId, operatorId);
  acceptDuration.add(res.timings.duration);

  const ok = checkAccepted(res);

  if (ok) {
    acceptedRequests.add(1);
  } else {
    failedRequests.add(1);
    console.error(`[VU ${__VU}] operatorId=${operatorId} status=${res.status} body=${res.body}`);
  }
}

export function teardown(data) {
  const winner = waitForWinner(data.jobId);

  check(winner, {
    'corrida resolvida (status finished)': (w) => w !== null,
  });

  if (winner) {
    console.log(`[teardown] jobId=${data.jobId} — vencedor da corrida: operatorId=${winner.operatorId}`);
  } else {
    console.error(`[teardown] jobId=${data.jobId} — corrida não resolveu a tempo (ainda 'pending').`);
  }
}
