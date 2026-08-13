export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Se não informado, um jobId novo é gerado no setup() de cada teste,
// garantindo uma "vaga" isolada para a disputa de concorrência.
export const JOB_ID = __ENV.JOB_ID || null;
