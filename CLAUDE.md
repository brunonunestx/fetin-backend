# CLAUDE.md

## Arquitetura

### Visão geral

Monorepo com pnpm workspaces (`services/pnpm-workspace.yaml`, pacotes em `services/*`).

- `services/core-api` — único serviço implementado: API em NestJS (MVC leve — controller fino, regra de negócio no service; ver skill `architecture` pra critérios de quando subir pra DDD/Hexagonal).
- `docs/` — diagrama de arquitetura de referência (`architechture.png`) e o enunciado do desafio (`Desafio-Tecnico-Backend.pdf`).
- `test/k6` + `test/helpers` — testes de carga/concorrência (k6); fica fora do workspace do pnpm de propósito (não é código do serviço).

### `services/core-api/src`

```
common/       # cross-cutting: exception filter global, logger estruturado (JSON), middleware de correlationId
generated/    # Prisma Client gerado — não editar à mão
modules/      # um diretório por feature/domínio, registrado em modules/index.ts
providers/    # infra compartilhada (Prisma, Redis, BullMQ), registrada em providers/index.ts
```

Como criar um module novo (estrutura de arquivos, quando usar publisher/processor, convenções de DTO) é coberto pela skill `backend` — usar essa skill em vez de decidir a estrutura na mão.

### Fluxo de referência: corrida no aceite de vaga (`job-subscription/`)

`POST /jobs/:id/accept` (autenticado, role `operator`, `operatorId` vem do JWT) só enfileira o pedido no BullMQ e responde de forma otimista — não decide o vencedor na hora. O `job-subscription.processor.ts` consome a fila (concorrência 1, ordem FIFO) e resolve a corrida com lock distribuído no Redis (`SET lock:jobId operatorId NX PX`, chave `jobOperator:jobId` guarda o vencedor definitivo) mais unique constraint no Postgres como segunda camada. O resultado é consultável depois via `GET /jobs/:id/accepted`. Esse é o padrão a seguir pra qualquer fluxo novo que precise resolver concorrência (fila + lock + consulta assíncrona de status).
