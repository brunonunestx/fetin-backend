// Teste de concorrência: 100 operadores tentando aceitar a mesma proposta
// (vaga) simultaneamente, via POST /vagas/:id/agendar.
//
// A API enfileira o aceite (BullMQ) e responde de forma otimista, então
// aqui validamos apenas a camada HTTP (todas as 100 requisições concorrentes
// devem ser aceitas com sucesso). A disputa em si (lock Redis + unique
// constraint no Postgres) é resolvida de forma assíncrona pelo worker.
//
// Após rodar o teste, confirme no banco que só existe UM vencedor para o
// jobId impresso no setup:
//   SELECT * FROM job_subscriptions WHERE job_id = '<jobId>';
//
// Uso:
//   k6 run test/k6/accept-proposal-race.test.js
//   k6 run -e BASE_URL=http://localhost:3000 -e JOB_ID=<uuid> test/k6/accept-proposal-race.test.js

import http from 'k6/http';
import { check } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { uuidv4 } from '../helpers/uuid.js';
import { BASE_URL, JOB_ID } from '../helpers/config.js';

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
  const payload = JSON.stringify({ operatorId });
  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  const res = http.post(`${BASE_URL}/vagas/${data.jobId}/agendar`, payload, params);
  acceptDuration.add(res.timings.duration);

  const ok = check(res, {
    'aceite recebido (2xx)': (r) => r.status >= 200 && r.status < 300,
  });

  if (ok) {
    acceptedRequests.add(1);
  } else {
    failedRequests.add(1);
    console.error(`[VU ${__VU}] operatorId=${operatorId} status=${res.status} body=${res.body}`);
  }
}

export function teardown(data) {
  console.log(
    `[teardown] jobId=${data.jobId} — verifique na tabela job_subscriptions que apenas 1 operador venceu a disputa.`,
  );
}
