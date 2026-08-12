# CLAUDE.md

## Histórico de prompts

Todo prompt enviado pelo usuário neste projeto é registrado automaticamente em `IA.md`, como histórico, com espaçamento entre os registros.

Isso é feito via hook `UserPromptSubmit` configurado em `.claude/settings.json` (não depende de memória do agente — roda automaticamente a cada prompt enviado, gerando um bloco com timestamp e o texto do prompt, separado por `---`).
