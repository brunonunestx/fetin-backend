# DECISÕES

Diagrama de arquitetura de referência: [docs/architecture.png](docs/architecture.png)

## Dispatch de waves

- **Fila dedicada para processamento de waves**: o `CronJob` (roda a cada 1 min) só lê as waves com `status=PENDING` e `sendAt < NOW()` e as publica numa fila de processamento — ele não levanta operadores nem faz fan-out inline. Quem faz esse trabalho pesado é um pool de workers consumindo a fila, com concorrência limitada.
  - **Motivo**: se várias vagas forem criadas num intervalo curto, seus offsets de onda (+10min, +20min) tendem a coincidir no mesmo tick do cron. Processar tudo inline naquele tick gera picos de carga no banco (queries geoespaciais concorrentes) e pode disparar milhares de notificações de uma vez, estourando o rate limit do provedor externo.
  - **Trade-off aceito**: o tempo exato de envio passa a depender da taxa de drenagem da fila (consistência eventual no timing) em troca de não ser CPU/memory-bound no banco — a concorrência do worker, configurada explicitamente (ex: 3-5 waves em paralelo), é o que de fato limita a carga.
  - **Idempotência necessária**: filas são at-least-once — uma wave reprocessada após retry/crash pode duplicar notificações. Preciso de dedupe key (`jobId`+`waveId`+`operatorId`) ou marcar a wave `PROCESSING`/`SENT` atomicamente ao enfileirar.

- **Fan-out por operador**: para cada wave processada, cada operador elegível é publicado individualmente na fila de notifications (`NotificationsQueuePublisher` → `NotificationsQueueConsumer` → `NotificationsProvider`), que valida a taxa de envio antes de chamar o serviço externo.
  - **Motivo**: desacopla o controle de rate limit do provedor externo (sem suporte a batch) do timing de disparo da onda.

- **Cancelamento manual da vaga**: Se uma vaga for cancelada, as waves referentes aquele JobId que tiverem como PENDING no banco serão marcadas como CANCELED e automaticamente serão ignoradas pelo Cron. Se o wave já estiver em processo de envio, não há interrupção.

- **Vaga aceita por algum operador**: Dentro do lock do redis que insere no banco o ganhador da corrida pela vaga, um publish em uma fila nova chamada cancelWaves com um payload contendo o jobId. O consumer dessa fila identifica pelo jobId quais waves precisa setar para canceled e evitar que seja dispatched pelo cron job.

## Resolução de corrida no aceite de vaga

- **Lock distribuído via Redis** (`SET lock:jobId operatorId NX PX 60000`) para decidir quem vence a corrida ao aceitar uma vaga (`/vagas/{id}/aceitar`).
  - Chave `lock:jobId` guarda a tentativa (com TTL, auto-recuperável se o processo travar).
  - Chave `jobOperator:jobId` guarda o vencedor definitivo — só é setada se ainda não existir; se já existir, apenas o operador registrado nela pode alterá-la.
- **`operatorId` extraído do JWT** (claims), não do body/query — evita spoofing do operador (aqui uso body, ver Fora de escopo).
- O vencedor da corrida é inserted na tabela JobSubscriptions, com constraint **UNIQUE** no jobId. Cada JobId pode ter apenas uma inscrição na vaga.

## Plano de latência para a tela "Vagas perto de mim"

- **Índices GiST** no PostGIS pra busca espacial (raio x), reduzindo o custo do `ST_DWithin`.
- **Índices BTree** em data e preço, se a carga não atender o p99 só com o GiST.
- **WebSocket**: Configurar um WebSocket Gateway para envio em tempo real das informações para o frontend, baseado nas queries de busca do cliente;
- **Medir P99**: Adicionar em cada evento emitido pelo WS um payload emittedAt, desse modo conseguimos fazer rampup de conexoes ate chegar em 500 conexoes simultaneas e medir o p99 de latencia da emissao do evento ate chegar ao cliente (k6)

## Webhook do provider externo

- **Expor uma rota /notifications/webhook**: Criar uma rota com validação de assinatura entre provider e serviço interno (garantia de que quem enviou o evento realmente é o provider). Controller vira um wrapper da fila, recebe o payload e joga pra fila (bullmq). O consumer tem como papel tratar esse webhook e atualizar o status da notificaçao.

- **Retry**: erro no processamento do webhook → lanço, o próprio BullMQ retenta. Se o provider reportar falha de entrega, reenfileiro e incremento `retries`; com 5 tentativas, marco como `FAILED`.
- **Controle de req/s**: a concorrência limitada do consumer garante que não ultrapasso os 600 req/s do provider.

## Anti-spam (máx. 3 notificações/dia)

- **Contagem via `notifications`**: antes do envio, o consumer conta os registros do `operatorId` no dia corrente (`sentAt` dentro dos boundaries do dia) — index composto `(operatorId, sentAt)`. Com 3 registros, a notificação é descartada sem enviar.

## Fora de escopo

- **Autenticação/JWT**: leio `operatorId` do body (`ScheduleJobSubscriptionDto`), não de claims de um token assinado. O desafio pede pra não implementar autenticação em código — mantive a decisão registrada (extrair do JWT) como o desenho alvo, mas não implementei o middleware de decode/validação.
- **Lógica de favoritos**: não modelei quem marca um operador como favorito de um local, nem onde isso fica persistido — é a pergunta 2 em aberto. A Onda 1 do dispatch depende disso e hoje deixei só um placeholder na entidade `operators`.
- **Edição de vaga com dispatch em andamento**: cobri o cancelamento (a vaga aceita ou cancelada interrompe as waves pendentes), mas não a edição de campos (endereço, valor, horário) com onda em curso — na premissa 3 assumo que evito redisparo por edição pra não spammar, porém não desenhei o que fazer com waves já enviadas referenciando dados antigos.
- **Timezone**: a plataforma opera em dois países com fusos diferentes, e não tratei isso em nenhuma decisão — `sendAt`, corte de "urgente" (<24h) e o pico de segunda 8h-10h provavelmente precisam ser calculados no fuso do local, não em UTC cru. Não fiz essa modelagem por falta de tempo. Solucao seria manter tudo em UTC e lidar com horarios especificos em cada pais, criando um port no sistema, toda data que entra eh convertida pra UTC, toda data que sai eh convertida na Timezone.
- **Observabilidade**: disse o que mediria (p99, RPS, latência de push) mas não desenhei dashboards, alerting ou SLOs — assumo que isso é iteração posterior ao MVP do dispatch.
