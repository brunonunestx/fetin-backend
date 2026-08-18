---
name: pipeline
description: Executa o ciclo backend-dev → code-reviewer card a card até esvaziar o board do GitHub Project deste repo — implementação, PR, revisão, merge automático se aprovado ou correção se reprovado (até 3 tentativas por card, depois escala). Use quando o usuário pedir para "rodar a pipeline", "limpar o board", ou processar os cards pendentes automaticamente.
---

Uma execução desta skill processa, um de cada vez, os cards que já estão no board em status inicial, até não sobrar nenhum. Não cria cards novos — o agente `task-definer` fica fora desse fluxo; a pipeline só consome issues já existentes no GitHub Project.

Quem segue este roteiro é quem invocou a skill (a sessão atual) — ela orquestra chamando `Agent(subagent_type: "backend-dev")` e `Agent(subagent_type: "code-reviewer")` repetidamente, um card por vez, mantendo o estado da fila e das tentativas.

## 0. Descobrir o board

```bash
OWNER=$(gh repo view --json owner -q .owner.login)
REPO=$(gh repo view --json name -q .name)
gh project list --owner "$OWNER" --format json | jq -r --arg t "$REPO" '.projects[] | select(.title == $t) | .number'
```

Se não retornar número, parar e avisar que o board `$REPO` não existe (mesmo pré-requisito da skill `task-definition`, seção "GitHub Project").

Descobrir o campo de status e as opções disponíveis:

```bash
gh project field-list <numero> --owner "$OWNER" --format json
```

Identificar o campo tipo "single select" que representa status (ex: `Status`) e os nomes das opções (ex: `Todo`, `In Progress`, `In Review`, `Done`). Se a nomenclatura não bater com esse padrão, **não assumir** — perguntar ao usuário quais opções usar para "pendente", "em progresso", "em revisão" e "concluído" antes de continuar.

## 1. Montar a fila

```bash
gh project item-list <numero> --owner "$OWNER" --format json
```

Filtrar pelos itens no status inicial (ex: `Todo`). Cada item deve ser uma Issue deste repo — se algum item não for uma Issue (ex: PR solto no board, nota), pular e avisar. A fila é fixada no início da execução (não repescar cards adicionados ao board depois que a pipeline já começou).

Se a fila estiver vazia, avisar "board já está limpo" e parar aqui.

## 2. Processar cada card da fila, sequencialmente

Para cada card, `tentativas = 1`, e repetir até aprovação ou `tentativas > 3`:

**2.1 — backend-dev**

Primeira tentativa do card:

```
Agent(subagent_type: "backend-dev", prompt: "Implemente a issue #<N> — <título>.
<corpo da issue>
Mova o card #<N> pra status 'In Progress' no início. Implemente seguindo as skills do
projeto (architecture/backend/nestjs). Ao terminar, use a skill `git` para abrir branch,
commitar, dar push e criar 1 PR linkado à issue #<N>. Depois mova o card pra 'In Review'.
Retorne a URL da PR criada.")
```

Retry após reprovação (mesma PR, não abrir uma segunda):

```
Agent(subagent_type: "backend-dev", prompt: "A PR <url> (issue #<N>) foi reprovada na
revisão. Findings do code-reviewer:
<findings>
Corrija na MESMA branch/PR — não abra uma PR nova. Depois de corrigir e dar push, retorne
a URL da PR (mesma).")
```

**2.2 — code-reviewer**

```
Agent(subagent_type: "code-reviewer", prompt: "Revise a PR <url> (issue #<N>). Dê um
veredito explícito: APROVADO ou REPROVADO. Se aprovado, mergeie a PR e mova o card #<N>
pra 'Done'. Se reprovado, não mergeie — liste os findings claramente.")
```

**2.3 — decidir**

- Veredito APROVADO → confirmar que a PR foi mergeada e o card movido pra "Done"; seguir pro próximo card da fila.
- Veredito REPROVADO e `tentativas < 3` → `tentativas += 1`, voltar ao 2.1 (retry) levando os findings recebidos.
- Veredito REPROVADO e `tentativas == 3` → **card travado**: não mergear, não insistir mais nesse card. Deixar a PR aberta e comentar nela (`gh pr comment <url> --body ...`) explicando que travou após 3 tentativas e precisa de revisão humana, com o resumo dos findings da última rodada. Deixar o card no board como está (normalmente "In Review", já sinaliza que tem PR pendente). Adicionar o card à lista de travados desta execução e **seguir pro próximo card da fila** — não parar a pipeline inteira por causa de um card.

## 3. Relato final

Ao esvaziar a fila: listar cards processados com sucesso (issue + PR mergeada), e os cards travados (issue + PR + motivo), se houver.

## Regras

- 1 PR por card — retry reaproveita a branch/PR existente, nunca abre uma segunda.
- Merge é automático quando o code-reviewer aprova — isso já foi autorizado pelo usuário como parte desta skill; não reconfirmar a cada card.
- `task-definer` não participa desse fluxo.
- Se o `gh` não tiver os scopes necessários (`project`), avisar e parar — não tentar contornar (ver seção 0 da skill `task-definition`).
