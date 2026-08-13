// Teste de concorrência com desempate esperado: 100 VUs chamam
// POST /vagas/:id/aceitar para a mesma proposta, mas cada VU aguarda
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
// O resultado é conferido no teardown via GET /vagas/:id/aceito: fazemos
// polling até status=FINISHED e comparamos o operatorId retornado com o
// esperado (VU 1).
//
// Uso:
//   k6 run test/k6/accept-proposal-race-ordered.test.js
//   k6 run -e STAGGER_MS=5 -e JOB_ID=<uuid> test/k6/accept-proposal-race-ordered.test.js

import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { orderedUuid } from '../helpers/uuid.js';
import { JOB_ID } from '../helpers/config.js';
import { scheduleAccept, checkAccepted } from '../helpers/schedule.js';
import { waitForWinner } from '../helpers/accept-status.js';

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
    'VU 1 venceu a corrida': (w) => w !== null && w.operatorId === EXPECTED_WINNER,
  });

  if (winner) {
    const outcome = winner.operatorId === EXPECTED_WINNER ? 'OK' : 'FALHOU';
    console.log(
      `[teardown] jobId=${data.jobId} — vencedor: operatorId=${winner.operatorId} | esperado=${EXPECTED_WINNER} | ${outcome}`,
    );
  } else {
    console.error(`[teardown] jobId=${data.jobId} — corrida não resolveu a tempo (ainda 'pending').`);
  }
}
