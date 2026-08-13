import http from 'k6/http';
import { sleep } from 'k6';
import { BASE_URL } from './config.js';

export const JobSubscriptionStatus = {
  PENDING: 'pending',
  FINISHED: 'finished',
};

// GET /vagas/:id/agendado — expõe o resultado da corrida (processada
// assincronamente pelo worker do BullMQ).
export function getAcceptStatus(jobId) {
  const res = http.get(`${BASE_URL}/vagas/${jobId}/agendado`);
  const body = res.status === 200 ? JSON.parse(res.body) : null;
  return { res, body };
}

// Faz polling em /agendado até a corrida ser resolvida (status FINISHED)
// ou o timeout ser atingido. Retorna o corpo da resposta ({status, operatorId})
// ou null se não resolveu a tempo.
export function waitForWinner(jobId, { timeoutSeconds = 15, pollIntervalSeconds = 0.5 } = {}) {
  const deadline = Date.now() + timeoutSeconds * 1000;

  while (Date.now() < deadline) {
    const { body } = getAcceptStatus(jobId);
    if (body && body.status === JobSubscriptionStatus.FINISHED) {
      return body;
    }
    sleep(pollIntervalSeconds);
  }

  return null;
}
