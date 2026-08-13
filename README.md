# tech-test

## Subir a API + banco

```
docker compose up -d
```

Sobe Postgres, Redis e a API (`http://localhost:3000`). No start do container, a API roda `prisma migrate deploy` antes de subir — não precisa rodar migration à parte.

## Rodar o teste de concorrência (k6)

Com a API já de pé (passo acima), roda o `test/run.sh` — ele instala o k6 localmente (sem sudo, em `test/.bin/`) se não encontrar um já instalado, e então executa o teste:

Teste principal — 100 operadores disputando a mesma vaga, valida que só 1 confirmação vence:

```
test/run.sh
```

Todas as variações (mesma validação, outros cenários de concorrência):

```
test/run.sh all
```

Ou uma variação específica:

```
test/run.sh k6/accept-proposal-race-ordered.test.js
test/run.sh k6/accept-proposal-race-multi-job.test.js
test/run.sh k6/accept-proposal-race-ordered-multi-job.test.js
```

## Alternativa: mesmo teste de concorrência, em vitest (sem instalar k6)

```
docker compose up -d
cd services/core-api
pnpm install
pnpm test
```

Cobre o mesmo cenário do teste principal do k6 (100 operadores disputando a mesma vaga via HTTP real) e confere o resultado direto na tabela `job_subscriptions`.
