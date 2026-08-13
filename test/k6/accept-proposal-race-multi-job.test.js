// Teste de concorrência com múltiplas vagas em paralelo: em vez de uma
// única corrida de 100 operadores para 1 jobId, rodamos JOB_COUNT corridas
// distintas ao mesmo tempo (scenarios paralelos do k6, todos começando em
// t=0), cada uma com VUS_PER_JOB operadores disputando o seu próprio jobId.
//
// Isso valida que o isolamento por jobId funciona sob carga real:
//   - lock Redis `lock:{jobId}` e `jobOperator:{jobId}` não vazam entre vagas;
//   - a fila SUBSCRIPTION_QUEUE processa corridas de vagas diferentes sem
//     que uma interfira no resultado da outra;
//   - cada uma das JOB_COUNT vagas termina com exatamente 1 vencedor.
//
// Uso:
//   k6 run test/k6/accept-proposal-race-multi-job.test.js
//   k6 run -e JOB_COUNT=10 -e VUS_PER_JOB=15 test/k6/accept-proposal-race-multi-job.test.js

import { check } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { uuidv4 } from '../helpers/uuid.js';
import { scheduleAccept, checkAccepted } from '../helpers/schedule.js';
import { waitForWinner } from '../helpers/accept-status.js';

const JOB_COUNT = Number(__ENV.JOB_COUNT || 5);
const VUS_PER_JOB = Number(__ENV.VUS_PER_JOB || 20);

const acceptedRequests = new Counter('accepted_requests');
const failedRequests = new Counter('failed_requests');
const acceptDuration = new Trend('accept_duration', true);

// Um scenario por vaga, todos com executor independente rodando em
// paralelo (comportamento padrão do k6: sem startTime, todos iniciam
// juntos). Cada scenario só recebe o próprio índice via env — o jobId de
// verdade é gerado com aleatoriedade real no setup() e repassado via data.
function buildScenarios() {
  const scenarios = {};

  for (let i = 0; i < JOB_COUNT; i++) {
    scenarios[`job_${i}`] = {
      executor: 'per-vu-iterations',
      vus: VUS_PER_JOB,
      iterations: 1,
      exec: 'raceForJob',
      env: { JOB_INDEX: String(i) },
    };
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

export function setup() {
  const jobIds = Array.from({ length: JOB_COUNT }, () => uuidv4());

  console.log(`[setup] ${JOB_COUNT} vagas em disputa paralela, ${VUS_PER_JOB} operadores cada:`);
  jobIds.forEach((jobId, i) => console.log(`  job_${i}: jobId=${jobId}`));

  return { jobIds };
}

export function raceForJob(data) {
  const jobIndex = Number(__ENV.JOB_INDEX);
  const jobId = data.jobIds[jobIndex];
  const operatorId = uuidv4();

  const res = scheduleAccept(jobId, operatorId, { job_index: String(jobIndex) });
  acceptDuration.add(res.timings.duration);

  const ok = checkAccepted(res);

  if (ok) {
    acceptedRequests.add(1);
  } else {
    failedRequests.add(1);
    console.error(`[job_${jobIndex} VU ${__VU}] operatorId=${operatorId} status=${res.status} body=${res.body}`);
  }
}

export function teardown(data) {
  let allResolved = true;

  data.jobIds.forEach((jobId, i) => {
    const winner = waitForWinner(jobId);
    allResolved = allResolved && winner !== null;

    check(winner, {
      [`job_${i} resolvido com vencedor único`]: (w) => w !== null,
    });

    if (winner) {
      console.log(`[teardown] job_${i} jobId=${jobId} — vencedor: operatorId=${winner.operatorId}`);
    } else {
      console.error(`[teardown] job_${i} jobId=${jobId} — não resolveu a tempo (ainda 'pending').`);
    }
  });

  if (!allResolved) {
    console.error('[teardown] nem todas as disputas paralelas resolveram a tempo.');
  }
}
