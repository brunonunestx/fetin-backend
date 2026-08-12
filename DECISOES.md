# DECISÕES

Diagrama de arquitetura de referência: [docs/architechture.png](docs/architechture.png)

## Dispatch de waves

- **Fila dedicada para processamento de waves**: o `CronJob` (roda a cada 1 min) só lê as waves com `status=PENDING` e `sendAt < NOW()` e as publica numa fila de processamento — ele não levanta operadores nem faz fan-out inline. Quem faz esse trabalho pesado é um pool de workers consumindo a fila, com concorrência limitada.
  - **Motivo**: se várias vagas forem criadas num intervalo curto, seus offsets de onda (+10min, +20min) tendem a coincidir no mesmo tick do cron. Processar tudo inline naquele tick gera picos de carga no banco (queries geoespaciais concorrentes) e pode disparar milhares de notificações de uma vez, estourando o rate limit do provedor externo.
  - **Trade-off aceito**: o tempo exato de envio de uma onda passa a depender da taxa de drenagem da fila, não só do `sendAt` — ou seja, assumimos consistência eventual no timing de envio em troca de não ser CPU/memory-bound no banco.
  - **Consequência**: a concorrência do worker (não a existência da fila em si) é o que de fato limita a carga no banco — precisa ser configurada explicitamente (ex: 3-5 waves em paralelo).
  - **Idempotência necessária**: filas são tipicamente at-least-once. Uma wave reprocessada após retry/crash pode duplicar notificações já publicadas. Precisamos de uma dedupe key (`jobId` + `waveId` + `operatorId`) ou marcar a wave como `PROCESSING`/`SENT` atomicamente ao ser enfileirada.

- **Fan-out por operador**: para cada wave processada, cada operador elegível é publicado individualmente na fila de notifications (`NotificationsQueuePublisher` → `NotificationsQueueConsumer` → `NotificationsProvider`), que valida a taxa de envio antes de chamar o serviço externo.
  - **Motivo**: desacopla o controle de rate limit do provedor externo (sem suporte a batch) do timing de disparo da onda.

- **Extensibilidade dos níveis de prioridade**: resolução de operadores por wave usa Strategy + Factory Pattern, permitindo adicionar novos níveis de prioridade sem alterar a lógica de consumo existente.

## Resolução de corrida no aceite de vaga

- **Lock distribuído via Redis** (`SET lock:jobId operatorId NX PX 60000`) para decidir quem vence a corrida ao aceitar uma vaga (`/vagas/{id}/aceitar`).
  - Chave `lock:jobId` guarda a tentativa (com TTL, auto-recuperável se o processo travar).
  - Chave `jobOperator:jobId` guarda o vencedor definitivo — só é setada se ainda não existir; se já existir, apenas o operador registrado nela pode alterá-la.
- **`operatorId` extraído do JWT** (claims), não do body/query — evita spoofing do operador que está aceitando a vaga.

## Persistência assíncrona

- **Escrita em lote via fila** (`Db Writer Publisher` → `Db Writer Queue` → `Consumer`): o resultado do aceite (`ACCEPTED`/`REJECTED`) é publicado numa fila e persistido via `insertMany`, reduzindo round-trips ao banco em cenários de alta concorrência.
