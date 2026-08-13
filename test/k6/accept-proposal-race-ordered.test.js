// Teste de concorrência com desempate esperado: 100 VUs chamam
// POST /vagas/:id/agendar para a mesma proposta, mas cada VU aguarda
// (__VU - 1) * STAGGER_MS antes de disparar a requisição. Isso escalona
// as chamadas em milissegundos, então a VU 1 é sempre a primeira a chegar.
//
// Como o worker do BullMQ processa a fila SUBSCRIPTION_QUEUE com
// concorrência 1 (ver src/providers/bullmq/bullmq.module.ts, sem override
// de `concurrency`), a ordem de processamento segue a ordem de chegada na
// fila. O lock Redis (SET NX) é adquirido pela primeira chamada, então
// esperamos que a VU 1 vença a corrida — ao contrário do teste
// accept-proposal-race.test.js, onde todas disparam ao mesmo tempo e o
// vencedor não é previsível.
//
// Uso:
//   k6 run test/k6/accept-proposal-race-ordered.test.js
//   k6 run -e STAGGER_MS=5 -e JOB_ID=<uuid> test/k6/accept-proposal-race-ordered.test.js
//
// Após rodar, confirme no banco que o vencedor foi a VU 1:
//   SELECT * FROM job_subscriptions WHERE job_id = '<jobId>';
//   -- operator_id esperado: 00000000-0000-4000-8000-000000000001

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { orderedUuid } from '../helpers/uuid.js';
import { BASE_URL, JOB_ID } from '../helpers/config.js';

const VUS = 100;
const STAGGER_MS = Number(__ENV.STAGGER_MS || 10);
const EXPECTED_WINNER = orderedUuid(1);

const acceptedRequests = new Counter('accepted_requests');
const failedRequests = new Counter('failed_requests');
const acceptDuration = new Trend('accept_duration', true);

export const options = {
  scenarios: {
    ordered_accept: {
      executor: 'per-vu-iterations',
      vus: VUS,
      iterations: 1,
      maxDuration: `${Math.ceil((VUS * STAGGER_MS) / 1000) + 30}s`,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
};

export function setup() {
  const jobId = JOB_ID || orderedUuid(Date.now());
  console.log(
    `[setup] jobId em disputa: ${jobId} | STAGGER_MS=${STAGGER_MS} | vencedor esperado (VU 1): ${EXPECTED_WINNER}`,
  );
  return { jobId };
}

export default function (data) {
  // Escalona o disparo: VU 1 sai imediatamente, VU 2 espera 1x STAGGER_MS, etc.
  const delaySeconds = ((__VU - 1) * STAGGER_MS) / 1000;
  if (delaySeconds > 0) {
    sleep(delaySeconds);
  }

  const operatorId = orderedUuid(__VU);
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
    `[teardown] jobId=${data.jobId} — verifique em job_subscriptions que operator_id=${EXPECTED_WINNER} (VU 1) venceu a disputa.`,
  );
}
