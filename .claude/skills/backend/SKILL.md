---
name: backend
description: Como criar um module novo em services/core-api seguindo a estrutura e convenções específicas deste projeto (module/controller/service/dto, quando adicionar publisher+processor pra fluxos assíncronos, registro em modules/index.ts e providers/index.ts). Use ao criar ou adicionar um recurso novo no backend deste repo. Para convenções genéricas de NestJS (DI, erros, logs, tipagem) e para revisar código já existente, ver a skill global `nestjs`.
---

Cobre só a estrutura **específica deste projeto**. Convenções genéricas de NestJS (DI via constructor, `class-validator`, erros 4xx/5xx, logs estruturados, nunca `any`) são responsabilidade da skill global `nestjs` — aplicar as duas juntas ao criar algo novo.

Referência viva da estrutura: `services/core-api/src/modules/job-subscription/`. Sempre que houver dúvida sobre um detalhe não coberto aqui, ler esse diretório em vez de assumir.

## 1. Onde entra um recurso novo

Todo recurso novo é um diretório em `services/core-api/src/modules/<nome>/`, com:

```
<nome>.module.ts        # registra controller + providers do module
<nome>.controller.ts    # rotas finas — recebe DTO, chama o service, devolve o retorno do service
<nome>.service.ts       # regra de negócio; injeta Prisma/Redis/outros providers via constructor
dto/
  <acao>.dto.ts          # um DTO por operação de entrada (ex: create-x.dto.ts)
  <recurso>-status.dto.ts # DTO de saída, se a resposta tiver forma própria (não é só o model do Prisma)
```

Se o fluxo precisa de processamento assíncrono (fila/worker), acrescentar:

```
<nome>.publisher.ts     # Injectable que só chama queue.add(...) — não tem lógica de negócio
<nome>.processor.ts     # @Processor(QUEUE_NAME) extends WorkerHost — consome e decide o resultado
```

O service decide **quando** publicar (chamando o publisher), o processor decide **o que fazer** quando o job é consumido. Não colocar lógica de negócio no controller nem no publisher.

## 2. Registro do module

- Adicionar o module em `services/core-api/src/modules/index.ts` (array `modules`), nunca importar direto no `app.module.ts`.
- Se o module precisar de infra nova (nova fila BullMQ, por exemplo), registrar em `services/core-api/src/providers/` e adicionar ao array `providers` em `providers/index.ts` — não instanciar client/queue manualmente dentro do module de feature.

## 3. Rotas e DTOs

- Path params validados via Pipe no controller (`@Param('id', ParseUUIDPipe)`), nunca `string` cru repassado pro service.
- Nomes de rota em português, no padrão já usado (`vagas/:id/agendar`, `vagas/:id/agendado`) — seguir o vocabulário do domínio já estabelecido nas rotas existentes, não traduzir pra inglês no meio do caminho.
- DTO de saída só quando a resposta não é simplesmente o model do Prisma (ex: `JobSubscriptionStatusDto` combina dado vindo do Redis e do Postgres) — não criar DTO de saída pra um `Promise<void>` ou pra um retorno que já é o model.

## 4. Fluxo assíncrono com concorrência (publisher/processor)

Quando o recurso precisa resolver uma corrida (N requisições disputando o mesmo resultado) ou só desacoplar trabalho pesado da resposta HTTP:

1. Controller → service → `publisher.publish(data)` (fila BullMQ), resposta HTTP otimista (não espera o processor).
2. `processor.process(job)`:
   - Se há disputa por um recurso único, usar lock distribuído no Redis antes de qualquer escrita — `RedisProvider.lock(key, value, ttlMs)` (`SET NX PX`), nunca reimplementar lock na mão.
   - Chaves Redis centralizadas em `RedisKeyBuilder` (`providers/redis/redis.key-builder.ts`) — adicionar o novo builder de chave ali, não montar string de chave inline no processor.
   - Mesmo com o lock, tratar a constraint única do Postgres como segunda camada de proteção (capturar `P2002` e tratar como "perdeu a corrida", não deixar subir como erro 500).
3. Se o cliente precisar consultar o resultado depois (a resposta HTTP não carrega o resultado final), expor um `GET` que primeiro olha a chave "vencedor" no Redis (mais rápido, evita ler o Postgres à toa) e só cai pro Postgres se não estiver em cache — ver `getAcceptStatus` em `job-subscription.service.ts`.

## 5. Antes de terminar

- Rodar o checklist da skill `nestjs` (convenções gerais) sobre o código novo.
- Se o module mexe em concorrência/lock/fila, considerar se merece um teste de carga em `test/k6/` (ver testes existentes de `accept-proposal-race-*` como modelo) e uma entrada em `DECISOES.md` explicando o trade-off escolhido.
