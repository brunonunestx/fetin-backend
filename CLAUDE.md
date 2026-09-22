# CLAUDE.md

## Arquitetura

### Visão geral

Repositório com dois pnpm workspaces independentes. Não criar um workspace ou lockfile na raiz:

- `services/` — workspace do backend (`services/pnpm-workspace.yaml`).
- `services/core-api` — API em NestJS (MVC leve — controller fino, regra de negócio no service; ver skill `architecture` pra critérios de quando subir pra DDD/Hexagonal).
- `apps/` — workspace do frontend (`apps/pnpm-workspace.yaml`), com tarefas orquestradas pelo Turborepo.
- `apps/web` — PWA mobile em React, Vite e TypeScript.
- `docs/` — escopo do frontend, diagrama de arquitetura de referência (`architecture.png`) e enunciado original do desafio (`Desafio-Tecnico-Backend.pdf`).
- `test/k6` + `test/helpers` — testes de carga/concorrência (k6); fica fora do workspace do pnpm de propósito (não é código do serviço).

Use o package manager fixado em cada workspace. Para o frontend, execute os comandos a partir de `apps/` com `corepack pnpm <script>`; para o backend, continue usando `services/`/`services/core-api` conforme o comando.

### `apps/web/src`

O frontend é organizado por feature. Diretórios novos devem ser criados somente quando houver código real para eles:

```
app/          # providers globais, roteamento e composição da aplicação
components/   # componentes compartilhados; primitives do shadcn ficam em components/ui
features/     # auth, profile, jobs, accepted-jobs e locals
layouts/      # shells e navegação por tipo de usuário
lib/          # cliente HTTP, ambiente, formatadores e utilitários sem regra de tela
test/         # configuração e helpers de testes
```

Convenções da base do frontend:

- TypeScript estrito e imports internos pelo alias `@/`.
- Axios centralizado em `src/lib/api/http-client.ts`; features não criam instâncias próprias.
- Variáveis expostas ao navegador são validadas em `src/lib/environment.ts`.
- Testes de unidade/componente ficam em `src/**/*.test.{ts,tsx}` (Vitest).
- Testes de jornada ficam em `apps/web/e2e/` (Playwright), separados da coleta do Vitest.
- `corepack pnpm lint`, `typecheck`, `test`, `build` e `test:e2e` rodam pelo Turbo a partir de `apps/`.

### `services/core-api/src`

```
common/       # cross-cutting: exception filter global, logger estruturado (JSON), middleware de correlationId
generated/    # Prisma Client gerado — não editar à mão
modules/      # um diretório por feature/domínio, registrado em modules/index.ts
providers/    # infra compartilhada (Prisma, Redis, BullMQ), registrada em providers/index.ts
```

Como criar um module novo (estrutura de arquivos, quando usar publisher/processor, convenções de DTO) é coberto pela skill `backend` — usar essa skill em vez de decidir a estrutura na mão.

### Fluxo de referência: candidatura + confirmação pelo local (`job-subscription/`)

O aceite de vaga não é mais "primeiro que chega, ganha": o vínculo final depende de confirmação explícita do `local_owner`.

- `POST /jobs/:id/accept` (autenticado, role `operator`, `operatorId` vem do JWT) cria uma candidatura (`JobCandidate`, status `PENDING`) de forma **síncrona** — não há mais fila/corrida nesse passo, só idempotência (candidatar-se de novo é no-op via `P2002`). Bloqueado se a vaga estiver cancelada ou já preenchida (`JobSubscription` confirmada).
- `GET /jobs/:id/candidates` (role `local_owner`, valida ownership do `Local`) lista as candidaturas da vaga.
- `POST /jobs/:id/candidates/:operatorId/confirm` (role `local_owner`, valida ownership) é quem enfileira no BullMQ e responde de forma otimista — a decisão de qual operador fica com a vaga é resolvida assincronamente. O `job-subscription.processor.ts` consome a fila (concorrência 1, ordem FIFO) e resolve com lock distribuído no Redis (`SET lock:jobId operatorId NX PX`, chave `jobOperator:jobId` guarda o vencedor definitivo) mais unique constraint no Postgres como segunda camada; dentro da mesma transaction, marca o `JobCandidate` confirmado como `CONFIRMED` e os demais `PENDING` da vaga como `REJECTED`.
- O resultado final é consultável via `GET /jobs/:id/accepted` (contrato inalterado: `pending`/`finished` + `operatorId`).

Esse é o padrão a seguir pra qualquer fluxo novo que precise resolver concorrência (fila + lock + consulta assíncrona de status) — mas note que a fila/lock hoje protege o passo de **confirmação** (ação de um único ator, o `local_owner`), não mais o passo de candidatura (que pode ter N candidatos sem disputa).

> `apps/web` (UX de operador "enviando aceite → confirming → won/lost" e tela do `local_owner`) ainda não foi atualizado pra esse fluxo — fica pendente como trabalho futuro.
