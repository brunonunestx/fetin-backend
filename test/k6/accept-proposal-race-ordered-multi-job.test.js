// Combina os dois testes anteriores: JOB_COUNT vagas disputadas em paralelo
// (accept-proposal-race-multi-job.test.js), mas dentro de cada vaga os
// VUS_PER_JOB operadores são escalonados em STAGGER_MS (como em
// accept-proposal-race-ordered.test.js) — então, para TODAS as vagas ao
// mesmo tempo, esperamos que o primeiro operador de cada uma vença a sua
// própria disputa.
//
// Isso valida, sob várias corridas simultâneas, que:
//   - cada vaga resolve para exatamente 1 vencedor (GET /vagas/:id/agendado);
//   - o vencedor é sempre quem chegou primeiro NAQUELA vaga — sem nenhuma
//     vaga "roubar" o resultado de outra por conta do lock/queue compartilhados.
//
// Nota sobre a ordenação: cada (vaga, operador) é o SEU PRÓPRIO scenario de
// 1 VU / 1 iteração, com `env` explícito dizendo qual vaga e qual posição
// ele representa, e `startTime` controlando o atraso. Isso evita depender
// de como o k6 numera __VU entre scenarios paralelos — algo que não é
// garantido pela API e já causou um bug aqui (ver histórico: tentamos
// inferir a posição a partir de __VU e todas as 5 vagas erraram o
// vencedor esperado). `startTime`, por outro lado, é uma opção comum e
// documentada, suportada por qualquer executor.
//
// Uso:
//   k6 run test/k6/accept-proposal-race-ordered-multi-job.test.js
//   k6 run -e JOB_COUNT=10 -e VUS_PER_JOB=15 -e STAGGER_MS=5 test/k6/accept-proposal-race-ordered-multi-job.test.js

import { check } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { orderedUuid, uuidv4 } from '../helpers/uuid.js';
import { scheduleAccept, checkAccepted } from '../helpers/schedule.js';
import { waitForWinner } from '../helpers/accept-status.js';

const JOB_COUNT = Number(__ENV.JOB_COUNT || 5);
const VUS_PER_JOB = Number(__ENV.VUS_PER_JOB || 20);
const STAGGER_MS = Number(__ENV.STAGGER_MS || 10);

const acceptedRequests = new Counter('accepted_requests');
const failedRequests = new Counter('failed_requests');
const acceptDuration = new Trend('accept_duration', true);

// Um scenario por (vaga, operador) — JOB_COUNT * VUS_PER_JOB no total.
// localVu=1 tem startTime 0 (dispara primeiro); os demais são escalonados
// em STAGGER_MS dentro da própria vaga.
function buildScenarios() {
  const scenarios = {};

  for (let jobIndex = 0; jobIndex < JOB_COUNT; jobIndex++) {
    for (let localVu = 1; localVu <= VUS_PER_JOB; localVu++) {
      scenarios[`job_${jobIndex}_op_${localVu}`] = {
        executor: 'per-vu-iterations',
        vus: 1,
        iterations: 1,
        exec: 'raceForJob',
        startTime: `${(localVu - 1) * STAGGER_MS}ms`,
        maxDuration: '30s',
        env: { JOB_INDEX: String(jobIndex), LOCAL_VU: String(localVu) },
      };
    }
  }

  return scenarios;
}

export const options = {
  scenarios: buildScenarios(),
  thresholds: {
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
};

// operatorId determinístico por (vaga, posição do operador dentro da vaga).
function operatorIdFor(jobIndex, localVu) {
  return orderedUuid(jobIndex * 100000 + localVu);
}

export function setup() {
  const jobIds = Array.from({ length: JOB_COUNT }, () => uuidv4());

  console.log(
    `[setup] ${JOB_COUNT} vagas em disputa paralela, ${VUS_PER_JOB} operadores cada, STAGGER_MS=${STAGGER_MS}:`,
  );
  jobIds.forEach((jobId, i) =>
    console.log(`  job_${i}: jobId=${jobId} | vencedor esperado: ${operatorIdFor(i, 1)}`),
  );

  return { jobIds };
}

export function raceForJob(data) {
  const jobIndex = Number(__ENV.JOB_INDEX);
  const localVu = Number(__ENV.LOCAL_VU);
  const jobId = data.jobIds[jobIndex];

  const operatorId = operatorIdFor(jobIndex, localVu);
  const res = scheduleAccept(jobId, operatorId, { job_index: String(jobIndex) });
  acceptDuration.add(res.timings.duration);

  const ok = checkAccepted(res);

  if (ok) {
    acceptedRequests.add(1);
  } else {
    failedRequests.add(1);
    console.error(`[job_${jobIndex} op_${localVu}] operatorId=${operatorId} status=${res.status} body=${res.body}`);
  }
}

export function teardown(data) {
  let allMatched = true;

  data.jobIds.forEach((jobId, i) => {
    const expectedWinner = operatorIdFor(i, 1);
    const winner = waitForWinner(jobId);
    const matched = winner !== null && winner.operatorId === expectedWinner;
    allMatched = allMatched && matched;

    check(winner, {
      [`job_${i} resolvido (status finished)`]: (w) => w !== null,
      [`job_${i} venceu o primeiro operador`]: (w) => w !== null && w.operatorId === expectedWinner,
    });

    if (winner) {
      console.log(
        `[teardown] job_${i} jobId=${jobId} — vencedor=${winner.operatorId} | esperado=${expectedWinner} | ${matched ? 'OK' : 'FALHOU'}`,
      );
    } else {
      console.error(`[teardown] job_${i} jobId=${jobId} — não resolveu a tempo (ainda 'pending').`);
    }
  });

  if (!allMatched) {
    console.error('[teardown] nem todas as vagas tiveram o desempate esperado (primeiro operador vencendo).');
  }
}
