---
description: Mostra o índice de módulos e ferramentas do omie-mcp (via cache da skill omie-skill), pra saber qual módulo/tool usar.
argument-hint: [módulo ou operação, opcional — ex: "estoque", "pedido de venda"]
---

Objetivo: dar ao usuário um ponto de entrada rápido pra descobrir qual
ferramenta `omie_*` usar, sem precisar ler `docs/FERRAMENTAS.md` inteiro.

1. Leia `.claude/skills/omie-skill/cache/_index.md` e mostre a tabela de
   módulos (nome, quantidade de ferramentas, resumo de uma linha).
2. Se o argumento `$ARGUMENTS` indicar um módulo ou operação específica (ex:
   "estoque", "ordem de produção", "contas a pagar"), identifique o arquivo
   correspondente na tabela, abra `.claude/skills/omie-skill/cache/<arquivo>`
   e resuma as ferramentas relevantes (nome, o que faz, parâmetros
   obrigatórios, se é destrutiva).
3. Se `.claude/skills/omie-skill/cache/manifest.json` não existir ou o
   diretório `cache/` estiver vazio, avise que o cache ainda não foi gerado
   e sugira rodar `/omie-skill:atualizar-cache`.

Não abra `docs/FERRAMENTAS.md` completo neste comando — o objetivo é
responder com o cache, que é a fração relevante.
