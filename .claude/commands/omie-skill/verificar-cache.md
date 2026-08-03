---
description: Verifica se o cache da skill omie-skill está desatualizado em relação ao registro de ferramentas do omie-mcp, sem regenerar nada.
allowed-tools: Bash(npm run skill-cache:check:*)
---

Rode `npm run skill-cache:check`. Esse comando compara um hash do registro
de ferramentas atual (`src/tools/registry.ts` + módulos) com o hash salvo em
`.claude/skills/omie-skill/cache/manifest.json` na última geração — não
escreve nada, só reporta.

Reporte o resultado pro usuário:

- Se estiver **atualizado**: diga isso e não faça mais nada.
- Se estiver **desatualizado**: diga isso e pergunte se o usuário quer que
  você rode `/omie-skill:atualizar-cache` agora.
