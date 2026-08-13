import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL } from './config.js';

// POST /vagas/:id/aceitar — dispara o aceite de uma proposta para um operador.
export function scheduleAccept(jobId, operatorId, tags) {
  const payload = JSON.stringify({ operatorId });
  const params = {
    headers: { 'Content-Type': 'application/json' },
    tags,
  };
  return http.post(`${BASE_URL}/vagas/${jobId}/aceitar`, payload, params);
}

export function checkAccepted(res) {
  return check(res, {
    'aceite recebido (2xx)': (r) => r.status >= 200 && r.status < 300,
  });
}
