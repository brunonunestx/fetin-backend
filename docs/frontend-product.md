# TrampoFácil — escopo e jornadas do frontend mobile

## Status do documento

Este documento define o primeiro MVP do frontend do TrampoFácil. Ele orienta a implementação do PWA e registra quais comportamentos já são suportados pela API, quais exigem pequenos ajustes no backend e quais foram deliberadamente deixados para depois.

## Visão do produto

O TrampoFácil conecta trabalhadores autônomos a pessoas e estabelecimentos que precisam contratar serviços pontuais. O produto deve permitir que alguém com pouca familiaridade com tecnologia entenda rapidamente onde está, o que pode fazer e qual foi o resultado de cada ação.

O MVP tem duas experiências:

- **Trabalhador:** encontra trabalhos, consulta os detalhes, aceita uma oportunidade e acompanha os trabalhos conquistados.
- **Contratante:** cadastra locais, publica vagas, acompanha o preenchimento e consulta o trabalhador selecionado.

O aplicativo será um PWA voltado exclusivamente para celulares Android e iPhone. Não haverá uma experiência desktop específica nesta primeira versão.

## Decisões confirmadas

- Nome inicial do produto: **TrampoFácil**.
- Interface em português do Brasil.
- React Web com Vite e TypeScript.
- Frontend em workspace próprio dentro de `apps`, sem modificar o workspace atual de `services`.
- pnpm e Turborepo para instalação e execução das tarefas do frontend.
- Tailwind CSS e componentes shadcn/ui customizados para a identidade do produto.
- Axios como cliente HTTP centralizado.
- O JWT atual será suficiente para o protótipo e poderá ser persistido localmente.
- Não serão implementados refresh token ou autenticação por cookie no MVP.
- O backend só será alterado quando uma informação for realmente necessária para uma tela ou jornada aprovada.

## Princípios de experiência

1. **Uma decisão principal por tela.** A ação mais importante deve ser visualmente evidente.
2. **Texto antes de símbolos.** Ícones complementam rótulos; nunca substituem palavras importantes.
3. **Linguagem cotidiana.** A interface não apresenta nomes técnicos como `operator`, `local_owner`, `jobId` ou `subscription`.
4. **Retorno imediato.** Toda ação informa se está carregando, se funcionou ou o que precisa ser corrigido.
5. **Erros recuperáveis.** Mensagens explicam o próximo passo e preservam o que já foi preenchido.
6. **Leitura confortável.** Texto-base de pelo menos 16 px, alto contraste e áreas de toque de pelo menos 48 px.
7. **Conteúdo essencial primeiro.** Valor, data, duração e local aparecem antes de descrições longas.
8. **Sem aparência de template.** Não serão usados gradientes decorativos, glassmorphism, excesso de cards, estatísticas falsas, depoimentos fictícios ou ilustrações genéricas.

## Vocabulário da interface

| Termo técnico | Texto para o usuário |
| --- | --- |
| `operator` | Trabalhador |
| `local_owner` | Contratante |
| `job` | Trabalho para o trabalhador; vaga para o contratante |
| `local` | Local de trabalho |
| `accept` | Aceitar trabalho |
| `pending` | Confirmando aceite |
| `finished` com o usuário atual | O trabalho é seu |
| `finished` com outro usuário | Outra pessoa conseguiu primeiro |
| `filled` | Vaga preenchida |
| `cancelledAt` preenchido | Vaga cancelada |

## Escopo do MVP

### Funcionalidades comuns

- Tela inicial curta com as opções “Quero trabalhar” e “Quero contratar”.
- Cadastro com e-mail, senha e tipo de conta.
- Login e logout.
- Recuperação da sessão enquanto o JWT for válido.
- Configuração e edição do próprio perfil.
- Visualização do perfil de outra pessoa dentro do contexto de uma vaga.
- Tratamento de carregamento, lista vazia, erro da API, sessão expirada e ausência de conexão.
- Orientação de instalação do PWA conforme o sistema operacional.

### Trabalhador

- Listar trabalhos disponíveis.
- Pesquisar, entre os resultados carregados, por título, profissão ou cidade.
- Consultar valor, data, horário, duração, descrição e endereço.
- Consultar o perfil do contratante responsável pela vaga.
- Confirmar o interesse antes de aceitar um trabalho.
- Acompanhar o processamento assíncrono do aceite.
- Saber claramente se conquistou ou perdeu a vaga.
- Consultar trabalhos conquistados, separando futuros e anteriores.

### Contratante

- Consultar os próprios locais.
- Cadastrar um novo local.
- Consultar as vagas de cada local.
- Publicar uma vaga em passos curtos.
- Consultar vagas abertas, preenchidas e canceladas.
- Cancelar uma vaga ainda existente.
- Consultar o perfil do trabalhador que conquistou uma vaga.

## Fora do MVP

- Feed social ou publicação de conteúdo.
- Conexões ou seguidores.
- Busca global por trabalhadores ou contratantes.
- Chat interno.
- Avaliações e reputação.
- Favoritos.
- Upload de foto de perfil.
- Recuperação ou troca de senha.
- Refresh token e autenticação por cookie.
- Edição ou exclusão de locais.
- Edição de uma vaga já publicada.
- Geolocalização, mapa ou cálculo real de distância.
- Filtros de raio e especialidade executados pelo backend.
- Notificações push.
- Pagamentos dentro do aplicativo.
- Publicação nas lojas Google Play e App Store.
- Experiência específica para desktop.

Essas funcionalidades podem ser adicionadas depois sem alterar as jornadas centrais do MVP.

## Dados pedidos em cada fluxo

Os formulários do frontend respeitarão as validações já existentes na API e não pedirão dados que o MVP não utiliza.

### Conta

- E-mail válido.
- Senha com no mínimo 8 caracteres.
- Tipo escolhido explicitamente entre trabalhador e contratante.

### Perfil do trabalhador

- Nome e telefone obrigatórios para concluir o onboarding.
- Profissão obrigatória.
- Idade e apresentação opcionais.
- Telefone normalizado para o formato E.164 antes do envio.

### Perfil do contratante

- Nome e telefone obrigatórios para concluir o onboarding.
- Apresentação opcional.
- Idade e profissão não serão solicitadas nessa jornada.

### Local de trabalho

- Nome, endereço, cidade, UF e CEP obrigatórios.
- UF sempre com duas letras maiúsculas.
- CEP aceito com ou sem hífen e normalizado antes do envio.

### Vaga

- Local previamente cadastrado.
- Título com pelo menos 3 caracteres.
- Descrição com pelo menos 10 caracteres.
- Data e horário futuros.
- Duração inteira maior que zero, informada com controles amigáveis de horas e minutos.
- Valor positivo com no máximo duas casas decimais.

## Arquitetura de navegação

### Rotas públicas

| Rota planejada | Objetivo |
| --- | --- |
| `/` | Verificar sessão e direcionar para a experiência correta. |
| `/boas-vindas` | Apresentar o produto e os dois tipos de conta. |
| `/entrar` | Autenticar uma conta existente. |
| `/cadastro` | Criar a conta e escolher o tipo de usuário. |

### Rotas compartilhadas autenticadas

| Rota planejada | Objetivo |
| --- | --- |
| `/completar-perfil` | Finalizar os dados essenciais após cadastro ou primeiro login. |
| `/perfil` | Consultar e editar o próprio perfil. |
| `/perfis/:userId` | Visualizar outra pessoa a partir de uma vaga relacionada. |

### Rotas do trabalhador

| Rota planejada | Objetivo |
| --- | --- |
| `/trabalhos` | Listar trabalhos disponíveis. |
| `/trabalhos/:jobId` | Consultar detalhes e aceitar um trabalho. |
| `/meus-trabalhos` | Consultar trabalhos conquistados. |

A navegação inferior do trabalhador terá: **Trabalhos**, **Meus trabalhos** e **Perfil**.

### Rotas do contratante

| Rota planejada | Objetivo |
| --- | --- |
| `/painel` | Resumir as vagas e destacar a ação de publicar. |
| `/locais` | Listar locais cadastrados. |
| `/locais/novo` | Cadastrar um local. |
| `/locais/:localId` | Consultar o local e suas vagas. |
| `/vagas/nova` | Publicar uma vaga. |
| `/vagas/:jobId` | Acompanhar ou cancelar uma vaga. |

A navegação inferior do contratante terá: **Início**, **Locais** e **Perfil**. A ação **Publicar vaga** ficará em destaque no painel e nas telas de lista pertinentes.

## Jornadas principais

### 1. Criar uma conta

1. A pessoa escolhe “Quero trabalhar” ou “Quero contratar”.
2. Informa e-mail e senha.
3. O frontend cria a conta em `POST /auth/register`.
4. Em seguida, autentica a nova conta em `POST /auth/login`.
5. Salva o JWT e consulta `GET /auth/me`.
6. Direciona para a configuração do perfil.
7. Ao terminar, abre a tela inicial correspondente ao tipo da conta.

Se o e-mail já existir, a pessoa permanece no cadastro e recebe uma mensagem que oferece o caminho para entrar.

### 2. Entrar em uma conta existente

1. A pessoa informa e-mail e senha.
2. O frontend chama `POST /auth/login`.
3. Salva o JWT e consulta `GET /auth/me` e `GET /profile`.
4. Perfil incompleto leva ao onboarding.
5. Perfil completo leva para `/trabalhos` ou `/painel`, conforme o tipo.

Qualquer resposta `401` em uma rota protegida encerra a sessão local e leva de volta para `/entrar`, explicando que é necessário entrar novamente.

### 3. Trabalhador aceita um trabalho

1. O trabalhador abre `/trabalhos`.
2. Vê apenas oportunidades futuras que não estão preenchidas nem canceladas.
3. Abre um trabalho e consulta as informações essenciais.
4. Pode abrir o perfil do contratante.
5. Toca em “Quero este trabalho”.
6. Confirma a ação em um diálogo simples.
7. O frontend chama `POST /jobs/:id/accept`.
8. A interface entra no estado “Confirmando aceite”.
9. O frontend consulta `GET /jobs/:id/accepted` periodicamente.
10. Se o `operatorId` vencedor for o usuário atual, mostra “O trabalho é seu”.
11. Se pertencer a outra pessoa, mostra “Outra pessoa conseguiu primeiro”.
12. As listagens de trabalhos disponíveis e conquistados são atualizadas.

Se o processamento demorar além do período normal, a interface não declara falha nem vitória: informa que a confirmação continua pendente e oferece “Verificar novamente”.

### 4. Trabalhador consulta trabalhos conquistados

1. O trabalhador abre `/meus-trabalhos`.
2. O frontend consulta `GET /me/accepted-jobs`.
3. Trabalhos futuros aparecem antes dos anteriores.
4. Cada item mostra data, horário, valor e local.
5. O trabalhador pode abrir os detalhes e o perfil do contratante.

### 5. Contratante cadastra um local

1. O contratante abre `/locais`.
2. Toca em “Adicionar local”.
3. Informa nome, endereço, cidade, UF e CEP.
4. O frontend valida os campos antes do envio.
5. Chama `POST /locals` e volta para a lista atualizada.

Não haverá integração com um serviço externo de CEP no MVP.

### 6. Contratante publica uma vaga

1. O contratante toca em “Publicar vaga”.
2. Escolhe um local previamente cadastrado.
3. Informa o trabalho e uma descrição breve.
4. Informa data, horário e duração.
5. Informa o valor.
6. Revisa um resumo em linguagem natural.
7. Confirma a publicação em `POST /jobs`.
8. É direcionado para os detalhes da vaga criada.

Caso não exista um local, a ação direciona primeiro ao cadastro de local e depois permite retomar a publicação.

### 7. Contratante acompanha ou cancela uma vaga

1. O contratante abre um local ou o painel.
2. Seleciona uma vaga.
3. A tela indica se ela está aberta, preenchida ou cancelada.
4. Em uma vaga preenchida, o contratante pode abrir o perfil do trabalhador vencedor.
5. Ao cancelar, a interface pede confirmação.
6. O frontend chama `PATCH /jobs/:id/cancel` e atualiza as listas.

## Estados de domínio apresentados no frontend

### Estado de uma vaga

| Estado visual | Regra |
| --- | --- |
| Disponível | `cancelledAt` ausente, `filled` falso e início no futuro. |
| Preenchida | `filled` verdadeiro. |
| Cancelada | `cancelledAt` preenchido. |
| Encerrada | Início no passado e sem outra classificação mais específica. |

Quando mais de uma regra for verdadeira, **cancelada** tem prioridade sobre **preenchida**, e **preenchida** tem prioridade sobre **encerrada**.

### Estado do aceite

| Estado do frontend | Comportamento |
| --- | --- |
| Pronto | O trabalhador ainda não confirmou o aceite. |
| Enviando | O pedido está sendo enviado para a API. |
| Confirmando | O pedido entrou na fila e o resultado está sendo consultado. |
| Conquistado | O vencedor retornado é o usuário atual. |
| Não conquistado | O vencedor retornado é outro usuário. |
| Pendente por mais tempo | Não há resultado definitivo; permite nova consulta. |
| Erro recuperável | Explica o problema e oferece nova tentativa. |

## Mapeamento da API

### Contratos existentes que serão consumidos

| Endpoint | Uso no frontend |
| --- | --- |
| `POST /auth/register` | Criar trabalhador ou contratante. |
| `POST /auth/login` | Obter o JWT. |
| `GET /auth/me` | Identificar usuário e tipo da conta. |
| `GET /profile` | Consultar o próprio perfil. |
| `GET /profile/:id` | Consultar os dados públicos de outra pessoa. |
| `PATCH /profile` | Completar ou editar o próprio perfil. |
| `GET /locals` | Listar locais do contratante. |
| `GET /locals/:id` | Consultar um local do contratante. |
| `POST /locals` | Cadastrar um local. |
| `GET /jobs` | Listar vagas e filtrar no frontend. |
| `GET /jobs?localId=:id` | Listar vagas de um local. |
| `GET /jobs/:id` | Consultar uma vaga. |
| `POST /jobs` | Publicar uma vaga. |
| `PATCH /jobs/:id/cancel` | Cancelar uma vaga. |
| `POST /jobs/:id/accept` | Solicitar o aceite de uma vaga. |
| `GET /jobs/:id/accepted` | Consultar o resultado do aceite. |
| `GET /me/accepted-jobs` | Consultar os trabalhos conquistados. |

### Ajustes do backend concluídos para o frontend

1. **Perfil por ID:** `GET /profile/:id` é autenticado e retorna somente `id`, tipo, nome, profissão e apresentação. E-mail, senha e telefone não são consultados nem expostos nessa visualização.
2. **Resumo do local na vaga:** listagem e detalhes retornam nome, endereço, cidade, UF, CEP e identificação do contratante no campo `local`.
3. **Local no histórico:** trabalhos aceitos incluem o mesmo resumo de local, permitindo exibir o endereço e acessar o perfil do contratante sem manipular UUIDs manualmente.
4. **CORS configurável:** a API permanece sem CORS quando `CORS_ORIGIN` não está definida. Em uma publicação com origens diferentes, a variável aceita uma ou mais origens separadas por vírgula. Em desenvolvimento, o proxy do Vite evita essa configuração.

Não será criado um cliente gerado por OpenAPI neste MVP. Os contratos usados pelo frontend serão tipados e validados na fronteira do cliente Axios.

## Regras de apresentação dos dados

- Valores usam real brasileiro e duas casas decimais.
- Datas e horários usam o fuso do aparelho e formato brasileiro.
- A data enviada ao backend será ISO 8601 com o deslocamento correto do aparelho.
- Durações serão apresentadas como texto, por exemplo “4 horas” ou “1 hora e 30 minutos”.
- CEP e telefone poderão ter máscara visual, mas serão normalizados antes do envio.
- Identificadores UUID nunca serão apresentados como conteúdo ao usuário.
- Mensagens técnicas da API serão convertidas em instruções curtas quando houver tradução conhecida.
- O `correlationId` será preservado para diagnóstico, mas só aparecerá em uma área secundária do erro.

## Identidade inicial

O nome **TrampoFácil** deve transmitir acesso direto ao trabalho sem infantilizar o público. A identidade visual seguirá estes pontos:

- Verde-petróleo como cor principal.
- Amarelo-ocre como cor de apoio e destaque.
- Fundo creme e texto grafite.
- Marca tipográfica simples, acompanhada de um símbolo pequeno de movimento ou conexão.
- Avatares gerados por iniciais enquanto não houver upload de foto.
- Textos curtos, concretos e respeitosos.

A identidade será implementada por tokens semânticos, permitindo ajustes de cor e tipografia sem reescrever componentes.

## Critérios de conclusão do MVP

- As duas jornadas podem ser demonstradas em um celular sem manipular IDs manualmente.
- Trabalhador e contratante nunca acessam ações exclusivas do outro papel.
- Todas as telas possuem estados de carregamento, vazio, erro e ausência de conexão quando aplicável.
- O aceite assíncrono nunca é apresentado como concluído antes da confirmação da API.
- Nenhuma vaga cancelada, preenchida ou passada aparece como disponível para o trabalhador.
- Perfis relacionados a uma vaga podem ser consultados nos dois sentidos.
- O PWA pode ser instalado e aberto em modo standalone no Android e no iPhone.
- A navegação funciona com áreas seguras do iPhone e alvos de toque adequados.
- O frontend passa por lint, verificação de tipos, testes e build de produção.
- A aplicação não depende de conteúdo fictício para demonstrar o fluxo principal.
