# TrampoFácil

PWA mobile para aproximar trabalhadores de serviços informais e pessoas que precisam contratar. O produto foi pensado para uso simples, com textos diretos, alvos de toque grandes e jornadas separadas para trabalhador e contratante.

## Estrutura do repositório

O projeto mantém dois workspaces pnpm independentes:

```text
apps/
  web/        PWA em React, Vite e TypeScript
services/
  core-api/   API em NestJS
test/
  k6/         Testes de concorrência da API
```

Não instale dependências na raiz. Use `corepack pnpm` dentro de `apps/` para o frontend e dentro de `services/` ou `services/core-api/` para o backend.

## Pré-requisitos

- Node.js 22.12 ou superior;
- Corepack habilitado;
- Docker com Docker Compose;
- navegadores do Playwright, caso queira executar os testes E2E.

## Executar frontend e backend juntos

Na raiz do repositório, suba Postgres, Redis e API:

```bash
docker compose up -d
```

A API estará disponível em `http://localhost:3000`. No início do container, ela executa `prisma migrate deploy`; não é necessário rodar migrations separadamente.

Em outro terminal, inicie o frontend:

```bash
cd apps
corepack pnpm install
corepack pnpm dev
```

Abra `http://localhost:5173`. Durante o desenvolvimento, chamadas para `/api` são encaminhadas pelo Vite para `http://localhost:3000`.

Para acompanhar os logs da API:

```bash
docker compose logs -f api
```

Para encerrar o ambiente:

```bash
docker compose down
```

`docker compose down` preserva o volume do Postgres. Acrescentar `-v` também remove os dados locais.

## Variáveis de ambiente

### Frontend

Copie `apps/web/.env.example` para `apps/web/.env.local` quando precisar alterar os valores locais:

```dotenv
VITE_API_URL=/api
API_PROXY_TARGET=http://localhost:3000
```

| Variável           | Uso                                                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_URL`     | URL base usada pelo navegador. Localmente, `/api` usa o proxy do Vite. Em produção, use a URL HTTPS absoluta da API. |
| `API_PROXY_TARGET` | Destino do proxy usado somente pelos servidores `dev` e `preview`. Não é incluída no bundle.                         |

Variáveis iniciadas com `VITE_` ficam públicas no JavaScript gerado e nunca devem conter segredos. Como `VITE_API_URL` é incorporada no build, alterar a API exige um novo build/deploy do frontend.

### Backend

As variáveis aceitas pela API estão exemplificadas em `services/core-api/.env.example`:

| Variável         | Uso                                                                                     |
| ---------------- | --------------------------------------------------------------------------------------- |
| `DATABASE_URL`   | Conexão com Postgres.                                                                   |
| `REDIS_URL`      | Conexão com Redis.                                                                      |
| `JWT_SECRET`     | Segredo de assinatura dos tokens; deve ser forte em produção.                           |
| `JWT_EXPIRES_IN` | Validade do JWT em segundos.                                                            |
| `CORS_ORIGIN`    | Origens permitidas, separadas por vírgula. Pode ficar ausente no fluxo local com proxy. |
| `PORT`           | Porta HTTP da API; o padrão é `3000`.                                                   |

Se frontend e API forem publicados em domínios diferentes, configure, por exemplo:

```dotenv
# frontend
VITE_API_URL=https://api.exemplo.com

# backend
CORS_ORIGIN=https://app.exemplo.com
```

Não inclua caminho, barra final ou curingas em `CORS_ORIGIN`; informe a origem exata. Para liberar mais de um ambiente, use uma lista como `https://app.exemplo.com,https://preview.exemplo.com`.

## Comandos do workspace `apps`

Execute estes comandos a partir de `apps/`:

| Comando                      | Finalidade                                              |
| ---------------------------- | ------------------------------------------------------- |
| `corepack pnpm dev`          | Inicia o frontend em desenvolvimento.                   |
| `corepack pnpm build`        | Verifica tipos, gera o PWA e valida o limite do bundle. |
| `corepack pnpm lint`         | Executa o ESLint sem aceitar avisos.                    |
| `corepack pnpm typecheck`    | Valida o TypeScript sem emitir arquivos.                |
| `corepack pnpm test`         | Executa testes unitários e de componentes.              |
| `corepack pnpm test:e2e`     | Executa Playwright em Mobile Chrome e Mobile Safari.    |
| `corepack pnpm format`       | Formata os arquivos do workspace.                       |
| `corepack pnpm format:check` | Verifica formatação sem alterar arquivos.               |

Na primeira execução dos testes E2E, instale os navegadores:

```bash
corepack pnpm --filter @trampofacil/web exec playwright install
```

## Testar o PWA localmente

O service worker é gerado no build de produção. Para testá-lo localmente:

```bash
cd apps
corepack pnpm build
corepack pnpm --filter @trampofacil/web preview:https
```

Abra `https://localhost:4173` e aceite o certificado apenas no ambiente local. Esse certificado é autoassinado; a instalação final em Android e iPhone deve ser validada usando uma publicação com HTTPS confiável.

O PWA armazena o app shell e os recursos estáticos. Respostas da API e listagens de vagas não são usadas como fonte confiável offline.

## Deploy HTTPS do frontend

O frontend está preparado para deploy estático na Vercel:

1. Importe o repositório como um novo projeto.
2. Selecione `apps/web` como **Root Directory**.
3. Use o preset **Vite**.
4. Confirme `pnpm build` como build command e `dist` como output directory.
5. Cadastre `VITE_API_URL` com a URL HTTPS pública da API.
6. Faça o deploy e valide a instalação em Android e iPhone reais.

O arquivo `apps/web/vercel.json` reescreve rotas desconhecidas para `index.html`. Assim, atualizar diretamente uma rota como `/jobs/123` não gera 404. O service worker possui um fallback equivalente para navegação quando o app shell já estiver instalado.

Em outro provedor de hospedagem estática, configure a mesma regra: qualquer navegação que não corresponda a um arquivo real deve servir `/index.html` com status `200`.

O servidor `vite preview` existe somente para inspeção local e não deve ser usado como servidor de produção.

### API em produção

A API possui `services/core-api/Dockerfile` e depende de Postgres e Redis. No provedor escolhido:

1. publique o container da API com HTTPS;
2. configure `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET` e `JWT_EXPIRES_IN`;
3. defina `CORS_ORIGIN` com a origem HTTPS do frontend;
4. configure `VITE_API_URL` no frontend com a URL HTTPS da API e gere um novo deploy.

Usar API HTTP em uma página HTTPS causa bloqueio de conteúdo misto no navegador.

## Funcionalidades do protótipo

### Trabalhador

- cadastro, login e preenchimento do perfil;
- busca e visualização de vagas disponíveis;
- aceite de vaga com confirmação e resultado assíncrono;
- histórico de trabalhos futuros e anteriores;
- visualização do perfil do contratante.

### Contratante

- cadastro, login e preenchimento do perfil;
- cadastro e consulta de locais;
- publicação, acompanhamento e cancelamento de vagas;
- visualização do trabalhador vencedor.

### Aplicativo

- instalação como PWA em Android e iPhone;
- indicação de conexão ausente e tentativa de reconexão;
- atualização disponível sem interromper formulários;
- navegação, foco e componentes acessíveis;
- layout mobile e suporte à preferência de movimento reduzido.

## Roteiro curto para a apresentação

Antes da feira, deixe a API online, duas contas com perfis completos e pelo menos um local cadastrado. Use uma vaga futura e mantenha uma gravação curta como contingência para instabilidade da rede.

1. **Problema — 20 segundos:** explique a dificuldade de conectar profissionais informais e contratantes por uma interface acessível.
2. **Dois caminhos — 20 segundos:** abra o TrampoFácil instalado e mostre as entradas “Buscar um serviço” e “Contratar alguém”.
3. **Contratante — 50 segundos:** entre na conta, mostre o local e publique uma vaga em passos curtos.
4. **Trabalhador — 50 segundos:** troque de conta/aparelho, encontre a vaga, abra os detalhes e confirme o aceite.
5. **Resultado — 40 segundos:** volte ao contratante, mostre a vaga preenchida e abra o perfil do vencedor.
6. **PWA e acessibilidade — 30 segundos:** destaque instalação, funcionamento do app shell sem conexão, textos claros e alvos de toque grandes.
7. **Fechamento — 20 segundos:** reforce que o protótipo reduz atrito para os dois públicos e pode evoluir para candidatura com aprovação.

## Fora de escopo do MVP

- chat e notificações push;
- avaliações e reputação;
- upload de fotos;
- geolocalização e mapas;
- recuperação de senha;
- edição ou exclusão de locais;
- refresh token, cookies de sessão e autenticação social;
- aprovação manual de candidatos pelo contratante;
- pagamentos dentro do aplicativo.

## Limitações conhecidas

- o primeiro trabalhador cujo aceite for processado vence a vaga; o contratante ainda não escolhe entre candidatos;
- o JWT é persistido no armazenamento local por se tratar de um protótipo acadêmico;
- os dados das vagas exigem conexão; offline é disponibilizado somente o app shell;
- a instalação no iPhone depende de “Compartilhar → Adicionar à Tela de Início”, sem prompt programático;
- a experiência foi projetada e testada prioritariamente para Android e iPhone, não para desktop;
- o certificado HTTPS do preview local é autoassinado e não substitui a validação em uma URL pública confiável.

## Testes de concorrência do backend

Com a API em execução, rode o teste principal. Ele instala o k6 localmente em `test/.bin/`, caso necessário, e valida que apenas um entre 100 trabalhadores vence a vaga:

```bash
test/run.sh
```

Para executar todas as variações:

```bash
test/run.sh all
```

Ou uma variação específica:

```bash
test/run.sh k6/accept-proposal-race-ordered.test.js
test/run.sh k6/accept-proposal-race-multi-job.test.js
test/run.sh k6/accept-proposal-race-ordered-multi-job.test.js
```

### Alternativa com Vitest

Com a API já disponível:

```bash
docker compose up -d
cd services/core-api
corepack pnpm install
corepack pnpm test
```

Esse teste cobre a corrida de 100 trabalhadores via HTTP real e confere o vencedor diretamente na tabela `job_subscriptions`.
