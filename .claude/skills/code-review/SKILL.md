---
name: code-review
description: Checklist de revisão específica deste projeto (core-api) — concorrência/lock, filas, DTOs, estrutura de module. Use ao revisar um diff/PR neste repo. Complementa a skill global `code-review` (bugs/simplificação genéricos) e a skill global `nestjs` (convenções gerais de NestJS) com os pontos que mais geram problema real neste domínio.
---

Aplicar junto com as skills globais `code-review` e `nestjs` — esta aqui cobre só o que é específico deste projeto. Não repetir aqui checklist genérico de NestJS (DI, `any`, class-validator); focar no que já causou dor de verdade neste domínio: concorrência, filas at-least-once e estrutura de module.

## 1. Concorrência e locks (qualquer fluxo que dispute um recurso único)

- Toda decisão de "quem ganha" um recurso disputado usa lock distribuído no Redis (`RedisProvider.lock`, `SET NX PX`) — nunca `SELECT` seguido de `UPDATE` sem lock, e nunca lock reimplementado na mão.
- O lock **não é a única proteção**: tem que existir uma segunda camada no Postgres (constraint `UNIQUE`) com o erro `P2002` tratado explicitamente como "perdeu a corrida" — se `P2002` sobe como 500 genérico, é bug.
- TTL do lock é curto e explícito (auto-recuperável se o processo travar) — lock sem TTL é falha latente.
- Chave de lock/estado centralizada em `RedisKeyBuilder` — string de chave montada inline no meio do processor/service é sinal de revisão.

## 2. Filas (BullMQ) e idempotência

- Fila é **at-least-once**: todo consumer que causa efeito externo (notificação, escrita, side-effect não idempotente) precisa de dedupe key ou transição de estado atômica ("PENDING → PROCESSING/SENT" só uma vez) antes de agir. Reprocessar o mesmo job não pode duplicar o efeito.
- Publisher só publica (`queue.add(...)`) — se tem regra de negócio no publisher, a lógica está no lugar errado (deveria estar no service, que decide *quando* publicar).
- Processor decide *o que fazer* com o job — mas não decide *se deve rodar*; isso é responsabilidade de quem publicou.
- Concorrência do consumer é explícita e propositalmente baixa quando existe rate limit de um provedor externo — não confiar em "vai dar certo" sem configurar `concurrency`.
- Resposta HTTP otimista (controller só enfileira e responde) exige um jeito do cliente consultar o resultado depois — conferir se existe o `GET` de status e se ele olha o cache/Redis antes de bater no Postgres.

## 3. Estrutura de module (ver skill `backend` pra criar do zero)

- Controller fino: recebe DTO já validado, chama o service, devolve o retorno — nenhuma regra de negócio, nenhum acesso direto a Prisma/Redis no controller.
- Path params validados via Pipe (`ParseUUIDPipe` etc.) — `string` cru repassado pro service é falha de validação.
- Module novo registrado em `modules/index.ts`, provider novo em `providers/index.ts` — import direto em `app.module.ts` ou instância manual de client/queue dentro de um module de feature é sinal de que a estrutura do projeto não foi seguida.
- DTO de saída só existe quando a resposta não é simplesmente o model do Prisma — DTO de saída pra um `Promise<void>` ou pra um retorno já-pronto é abstração desnecessária.

## 4. Erros e observabilidade

- Erro tratável (ex: `P2002`, "perdeu a corrida", validação de domínio) nunca sobe como 500 genérico — precisa ser capturado e mapeado pro filtro de exceção global com o status certo.
- Log estruturado (JSON) nos pontos de decisão de um fluxo assíncrono (lock ganho/perdido, job processado/retry/falha definitiva) — sem log nesses pontos, um bug de concorrência em produção é indiagnosticável.
- `correlationId` propagado quando o fluxo atravessa controller → fila → processor, não só no request HTTP síncrono.

## 5. O que sinalizar mas não bloquear sozinho

- Ausência de teste de carga/concorrência (`test/k6/`) pra um fluxo novo que resolve corrida — vale perguntar, mas a skill `backend` já cobre quando isso é esperado.
- Rotas em inglês onde o resto do domínio usa português (`vagas/:id/aceitar`) — inconsistência de vocabulário, não bug funcional.
