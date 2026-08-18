# Tasks v1 — fluxo base (rascunho pra revisão)

Escopo: auth (operator/local_owner, JWT, bcrypt), criação de local, criação de vaga, candidatura pra vaga (reaproveitando a concorrência já implementada em `job-subscription`), e configuração de perfil. Fora de escopo: dispatch de waves.

Estado atual do código (`services/core-api/src`): só existe o módulo `job-subscription` (aceite de vaga com fila + lock Redis + unique constraint), operando sobre `jobId`/`operatorId` crus recebidos no body — sem autenticação, sem model de `User`, `Local` ou `Job` no Prisma (`infra/prisma/schema.prisma` só tem `JobSubscription`). Nenhuma dependência de auth (bcrypt/jwt) está instalada no `package.json` ainda.

Ordem de execução sugerida: 1 → 2 → 3 → 4 → 5 → 6 (cada task depende da anterior existir).

Cada task abaixo vira uma GitHub Issue (template Contexto / Onde mexer / Critérios de aceite) adicionada ao Project, só depois da sua revisão.

---

## Task 1 — Modelagem de usuários + cadastro/login (auth base)

### Contexto
Não existe model de usuário nem autenticação no projeto. Operators (funcionários que aceitam vaga) e locals (donos que criam vaga) precisam de conta própria, com senha em hash e um jeito de se identificar nas próximas requisições. Esta task cria a base — model + cadastro + login — sem ainda proteger rotas (isso é a Task 2).

### Onde mexer
- `services/core-api/infra/prisma/schema.prisma` — novo model `User` (id, email único, passwordHash, type: enum `OPERATOR` | `LOCAL_OWNER`, createdAt).
- `services/core-api/package.json` — adicionar `bcrypt` (+ `@types/bcrypt`) e `@nestjs/jwt` (+ `passport`/`@nestjs/passport`/`passport-jwt` se for usar Guard com Passport na Task 2).
- `services/core-api/src/modules/auth/` — módulo novo: `auth.module.ts`, `auth.controller.ts`, `auth.service.ts`, `dto/register.dto.ts`, `dto/login.dto.ts`.
- `services/core-api/src/modules/index.ts` — registrar `AuthModule`.
- `services/core-api/.env(.example)` — variável `JWT_SECRET` (e expiração, se aplicável).

### Critérios de aceite
- [ ] `POST /auth/register` cria um `User` com `type` = `operator` ou `local_owner`, senha salva como hash bcrypt (nunca em texto puro).
- [ ] Tentar registrar email já existente retorna 409/erro de conflito, não 500.
- [ ] `POST /auth/login` com credenciais válidas retorna um JWT assinado contendo `userId` e `type`.
- [ ] `POST /auth/login` com senha errada ou email inexistente retorna 401 — não vaza qual dos dois estava errado.

---

## Task 2 — Guard de autenticação e autorização por tipo de usuário

### Contexto
Com login funcionando (Task 1), as rotas que vão surgir nas próximas tasks (criar local, criar vaga, perfil, candidatura) precisam identificar quem está chamando e restringir por tipo de usuário (`operator` vs `local_owner`). Precisa existir um guard reutilizável antes de criar essas rotas.

### Onde mexer
- `services/core-api/src/common/` — `jwt-auth.guard.ts` (valida token, popula `request.user` com `userId`/`type`) e `roles.guard.ts` + decorator `@Roles('operator' | 'local_owner')`.
- `services/core-api/src/modules/auth/` — estratégia JWT (`jwt.strategy.ts`), se usando Passport.

### Critérios de aceite
- [ ] Requisição sem token (ou token inválido/expirado) numa rota protegida retorna 401.
- [ ] Requisição com token válido mas tipo errado (ex: operator tentando criar local) retorna 403.
- [ ] `request.user.userId` e `request.user.type` ficam disponíveis nos controllers protegidos.

---

## Task 3 — Configuração de perfil

### Contexto
Depois de criar a conta, o usuário completa dados de perfil: nome, idade, telefone, position (profissão) e bio (descrição breve). Aplica a ambos os tipos de usuário.

### Onde mexer
- `services/core-api/infra/prisma/schema.prisma` — campos de perfil no próprio `User` (ou model `Profile` 1:1, se preferir separar identidade de auth de dados de perfil — decidir na implementação) com: `name`, `age`, `phone`, `position`, `bio`.
- `services/core-api/src/modules/profile/` — módulo novo: controller + service + `dto/update-profile.dto.ts` (validação de cada campo com `class-validator`).
- `services/core-api/src/modules/index.ts` — registrar `ProfileModule`.

### Critérios de aceite
- [ ] `PATCH /profile` (autenticado, usa `userId` do token — não recebe id no body/params) atualiza os campos do usuário logado.
- [ ] Payload inválido (ex: `age` negativa, `phone` fora do formato esperado) retorna 400 com detalhe do campo.
- [ ] `GET /profile` (autenticado) retorna os dados de perfil do usuário logado.

---

## Task 4 — Criação de local

### Contexto
Um `local_owner` precisa cadastrar o(s) local(is) onde vai abrir vagas. É pré-requisito pra Task 5 (toda vaga pertence a um local).

### Onde mexer
- `services/core-api/infra/prisma/schema.prisma` — model `Local` (id, ownerId → `User`, name, endereço/campos básicos, createdAt).
- `services/core-api/src/modules/local/` — módulo novo: controller + service + `dto/create-local.dto.ts`.
- `services/core-api/src/modules/index.ts` — registrar `LocalModule`.

### Critérios de aceite
- [ ] `POST /locals` só aceita chamada de usuário autenticado com `type = local_owner` (403 pra operator).
- [ ] Local criado fica vinculado ao `ownerId` do usuário autenticado (não recebido no body).
- [ ] Payload inválido retorna 400 com detalhe do campo.

---

## Task 5 — Criação de vaga

### Contexto
Com um local existente (Task 4), o `local_owner` cadastra vagas nesse local. É a vaga que operators vão poder aceitar depois (Task 6).

### Onde mexer
- `services/core-api/infra/prisma/schema.prisma` — model `Job` (id, localId → `Local`, título, descrição, campos básicos da vaga, createdAt).
- `services/core-api/src/modules/job/` — módulo novo: controller + service + `dto/create-job.dto.ts`. Nome do módulo evita colisão com `job-subscription` já existente.
- `services/core-api/src/modules/index.ts` — registrar `JobModule`.

### Critérios de aceite
- [ ] `POST /jobs` só aceita `local_owner` autenticado, e só pra um `localId` que pertence a ele (403 se o local for de outro owner).
- [ ] Payload inválido retorna 400 com detalhe do campo.
- [ ] Vaga criada é consultável (endpoint de leitura mínimo, ex: `GET /jobs/:id`) — necessário pra Task 6 validar que o `jobId` existe.

---

## Task 6 — Autenticar a candidatura/aceite de vaga existente

### Contexto
O fluxo de concorrência pra aceitar vaga **já está implementado** em `job-subscription` (fila BullMQ + lock Redis + unique constraint no Postgres — ver `job-subscription.processor.ts`) e não deve ser reescrito. Hoje ele recebe `operatorId` cru no body, expõe rotas em português (`/vagas/:id/aceitar`, `/vagas/:id/aceito`) e não valida se o `jobId` existe de verdade. Esta task liga esse fluxo já pronto à autenticação (Task 2) e à vaga real (Task 5), e alinha as rotas com o padrão em inglês adotado nas tasks anteriores — não mexe na lógica de concorrência em si.

### Onde mexer
- `services/core-api/src/modules/job-subscription/job-subscription.controller.ts` — trocar `@Controller('vagas')` por `@Controller('jobs')`, renomear rota `POST :id/aceitar` para `POST :id/accept` (passa a exigir autenticação `operator`, usando `request.user.userId` como `operatorId` em vez de receber no body) e `GET :id/aceito` para `GET :id/accepted`.
- `services/core-api/src/modules/job-subscription/dto/schedule-job-subscription.dto.ts` — remover `operatorId` do body (não é mais input do cliente).
- `services/core-api/src/modules/job-subscription/job-subscription.service.ts` — validar que o `jobId` existe (via `JobModule`/Prisma) antes de publicar na fila; senão 404.
- `CLAUDE.md` (raiz) — atualizar a referência às rotas antigas (`POST /vagas/:id/aceitar`, `GET /vagas/:id/aceito`) pras novas em inglês.

### Critérios de aceite
- [ ] `POST /jobs/:id/accept` sem token retorna 401; com token de `local_owner` retorna 403.
- [ ] `operatorId` usado na corrida vem do JWT, nunca do body.
- [ ] Aceitar um `jobId` inexistente retorna 404 em vez de enfileirar.
- [ ] `GET /jobs/:id/accepted` continua consultável com o mesmo comportamento de antes (só a rota muda de nome).
- [ ] Comportamento de concorrência (lock Redis + unique constraint, resolução via fila) continua idêntico ao atual — sem regressão nos testes de `test/k6` e nos specs existentes do módulo.

---

## Fora de escopo (v1)

- Dispatch de waves de vagas pra operators.
- CRUD completo (edição/remoção) de local, vaga e perfil — só criação/leitura mínima necessária pro fluxo funcionar.
- Listagem/filtro de vagas por local, busca de operators, etc.
