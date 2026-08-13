---
name: write-spec
description: Escreve uma spec curta e descritiva (sem código) explicando a ideia de uma mudança antes de implementá-la — contexto, o que muda, fora do escopo, perguntas em aberto. Use quando o usuário pedir uma spec, um resumo de proposta, ou quiser alinhar a ideia de uma mudança antes de partir pro código.
---

Uma spec aqui é uma descrição da **ideia**, não um design técnico. Serve pra alinhar entendimento antes de tocar em código — se o pedido já é "implementa X", isso não é uma spec, é a skill `backend`/`nestjs` entrando em ação direto.

## Regras

- **Sem código.** Nada de snippets, nomes de arquivo, assinatura de função, schema, endpoint específico. Se a ideia só faz sentido citando uma classe ou rota existente pra dar contexto, tudo bem citar o nome, mas não é o foco — o foco é o comportamento e o motivo.
- **Curta.** Poucos parágrafos por seção, não um documento de design completo. Se está passando de ~1 página, provavelmente é mais de uma spec, ou já virou detalhe de implementação que não pertence aqui.
- **Descreve o quê e o porquê, não o como.** "O aceite de vaga passa a expirar depois de X minutos sem confirmação" é spec. "Adicionar campo `expiresAt` e um cron que roda a cada minuto" é implementação — não entra aqui.

## Template

```markdown
# <título curto da mudança>

## Contexto
<motivação em 2-4 frases — o problema atual ou a necessidade que originou a ideia>

## O que muda
<descrição do comportamento novo/alterado, em prosa ou bullets — o que um usuário/sistema externo passa a observar de diferente>

## Fora do escopo
<opcional — o que deliberadamente NÃO faz parte dessa mudança, pra evitar scope creep>

## Perguntas em aberto
<opcional — dúvidas sobre o domínio que ainda não têm resposta>

## Premissas
<opcional — o que foi assumido na ausência de resposta pras perguntas acima, e o que muda se a premissa estiver errada>
```

As seções "Perguntas em aberto" e "Premissas" seguem o mesmo espírito de `PERGUNTAS-E-PREMISSAS.md` na raiz do projeto — usar quando a ideia depende de algo do domínio que não foi confirmado, em vez de silenciosamente assumir e seguir.

## Fluxo

1. Se o pedido do usuário não deixar claro o suficiente pra preencher "Contexto" e "O que muda", perguntar antes de escrever — não inventar motivação.
2. Escrever a spec seguindo o template. Omitir seções opcionais que não se aplicam (não deixar cabeçalho vazio "N/A").
3. Salvar em `.claude/specs/<slug-kebab-case>.md` (slug curto derivado do título).
4. Mostrar o conteúdo pro usuário — specs orientam decisão de outras pessoas, então vale confirmar antes de considerar concluído.
