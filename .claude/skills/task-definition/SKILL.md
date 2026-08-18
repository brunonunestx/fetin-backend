---
name: task-definition
description: Define uma task técnica — contexto, onde mexer no código e critérios de aceite verificáveis — e cria como GitHub Issue neste repo, adicionada ao GitHub Project (board) do repositório. Use quando o usuário pedir pra criar uma task/issue no GitHub, documentar onde mexer e critérios de aceite antes de implementar algo, ou "criar isso no GitHub Projects".
---

Task aqui é o plano técnico de uma mudança: o que precisa ser feito, em quais arquivos/módulos, e como saber que ficou pronto. Diferente de `write-spec` (ideia, sem código) e de `jira` (card no Jira) — esta skill é independente das duas e sempre produz uma GitHub Issue linkada a um GitHub Project.

## 0. Pré-requisito: escopo do token

```bash
gh auth status
```

Se os scopes não incluírem `project`, a criação/edição de Project vai falhar. Nesse caso, pedir pro usuário rodar (não rodar por ele — é uma auth interativa):

```bash
gh auth refresh -s project
```

## 1. Levantar informações

- **Título** curto no imperativo (ex: "Adicionar expiração no aceite de vaga").
- **Contexto**: se o pedido do usuário não deixar claro o motivo/motivação, perguntar — não inventar.
- **Onde mexer**: não perguntar de cara — investigar o código primeiro (Grep/Glob/Read nos módulos relevantes de `services/core-api/src`) e listar os arquivos/diretórios prováveis. Só perguntar ao usuário se a investigação não for suficiente pra decidir.
- **Critérios de aceite**: comportamento observável e verificável, não tarefas técnicas soltas (ex: "GET /vagas/:id/aceito retorna 404 antes da expiração" é critério; "criar campo expiresAt" não é).

## 2. Template do corpo da issue

```markdown
## Contexto
<motivação em 2-4 frases — o porquê, não só o quê>

## Onde mexer
- `caminho/do/arquivo.ts` — o que muda ali
- `modules/xyz/` — módulo novo, se for o caso

## Critérios de aceite
- [ ] critério verificável 1
- [ ] critério verificável 2
```

## 3. Confirmar antes de criar

Mostrar o rascunho completo (título + corpo) pro usuário e confirmar — abrir uma issue e mexer no Project é visível pro resto do time, então não criar sem essa confirmação, mesmo que a skill tenha sido invocada explicitamente.

## 4. Localizar o GitHub Project

O board é criado manualmente pelo usuário (não pela skill) e tem o mesmo nome do repositório. Resolver owner/repo dinamicamente e localizar o número do project:

```bash
OWNER=$(gh repo view --json owner -q .owner.login)
REPO=$(gh repo view --json name -q .name)
gh project list --owner "$OWNER" --format json | jq -r --arg t "$REPO" '.projects[] | select(.title == $t) | .number'
```

Se não retornar número, **não criar o project** — parar e avisar o usuário que o board `$REPO` ainda não existe no owner `$OWNER`, pra ele criar antes de tentar de novo.

## 5. Criar a issue e linkar ao Project

```bash
ISSUE_URL=$(gh issue create --repo "$OWNER/$REPO" --title "<título>" --body "<corpo do template>")
gh project item-add <project-number> --owner "$OWNER" --url "$ISSUE_URL"
```

## 6. Reportar

Mostrar o link da issue criada pro usuário como confirmação final.
