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

### Fluxo de referência: corrida no aceite de vaga (`job-subscription/`)

`POST /jobs/:id/accept` (autenticado, role `operator`, `operatorId` vem do JWT) só enfileira o pedido no BullMQ e responde de forma otimista — não decide o vencedor na hora. O `job-subscription.processor.ts` consome a fila (concorrência 1, ordem FIFO) e resolve a corrida com lock distribuído no Redis (`SET lock:jobId operatorId NX PX`, chave `jobOperator:jobId` guarda o vencedor definitivo) mais unique constraint no Postgres como segunda camada. O resultado é consultável depois via `GET /jobs/:id/accepted`. Esse é o padrão a seguir pra qualquer fluxo novo que precise resolver concorrência (fila + lock + consulta assíncrona de status).
