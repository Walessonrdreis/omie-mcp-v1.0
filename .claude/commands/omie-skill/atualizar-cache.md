---
description: Regenera o cache da skill omie-skill (referência de ferramentas por módulo) a partir do registro atual de ferramentas do omie-mcp.
allowed-tools: Bash(npm run skill-cache:*)
---

Rode `npm run skill-cache` (compila o projeto e regenera
`.claude/skills/omie-skill/cache/*.md` + `manifest.json` a partir de
`src/tools/registry.ts`).

Depois de rodar:

- Se o comando falhar (ex: erro de compilação TypeScript), mostre o erro pro
  usuário — não tente "consertar" o cache manualmente.
- Se funcionar, informe quantas ferramentas/módulos o cache agora tem (saída
  do próprio comando já traz esse total) e, se o `manifest.json` anterior
  ainda estiver disponível no histórico do git, mencione o que mudou (novas
  ferramentas, módulos removidos) só se for informação fácil de obter — não
  é obrigatório investigar a fundo.

Só rode este comando quando o usuário pedir explicitamente ou quando você
mesmo tiver acabado de alterar `src/tools/registry.ts` / `src/modules/**` e
precisar que o cache reflita isso. Não rode como parte de uma consulta comum
sobre ferramentas — use `/omie-skill:guia` pra isso.
