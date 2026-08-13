# tech-test

## Subir a API + banco

```
docker compose up -d
```

Sobe Postgres, Redis e a API (`http://localhost:3000`). No start do container, a API roda `prisma migrate deploy` antes de subir — não precisa rodar migration à parte.

## Rodar o teste de concorrência (k6)

Requer [k6](https://k6.io/docs/get-started/installation/) instalado localmente. Com a API já de pé (passo acima):

Teste principal — 100 operadores disputando a mesma vaga, valida que só 1 confirmação vence:

```
k6 run test/k6/accept-proposal-race.test.js
```

Variações (mesma validação, outros cenários de concorrência):

```
k6 run test/k6/accept-proposal-race-ordered.test.js
k6 run test/k6/accept-proposal-race-multi-job.test.js
k6 run test/k6/accept-proposal-race-ordered-multi-job.test.js
```
