# Prompt reutilizável: executar o cache MCP do módulo de Ordem de Produção

Cole este prompt no início de uma **sessão nova** pra executar os dois
planos já escritos (spec e planos aprovados numa sessão anterior — ver
`docs/superpowers/specs/2026-08-07-cache-mcp-op-design.md`).

---

## Contexto pra colar junto

- Dois planos sequenciais, já escritos e commitados:
  1. `docs/superpowers/plans/2026-08-07-pnpm-workspace-cleanup.md` (3 tasks) —
     corrige a mistura npm/pnpm que quebrou o `vitest` da raiz, conecta
     `packages/omie-data` como dependência real do workspace pnpm da raiz.
  2. `docs/superpowers/plans/2026-08-07-cache-mcp-op.md` (12 tasks) — módulo
     de Ordem de Produção: cache local em `omie-data` (padrão Dado Bruto →
     Coleta → Tradução → View → Consulta, mesmo de Produtos/Estoque) +
     duas ferramentas MCP no servidor raiz (`omie_op_atualizar_cache` e
     `omie_op_listar_com_produto` migrada pra ler do cache).
- **O plano 2 depende do plano 1 estar concluído primeiro** — não pular.
- Contexto de negócio: hoje o servidor MCP (`src/`, raiz) bate ao vivo na
  Omie a cada chamada de ferramenta. O `omie-data` (`packages/omie-data/`)
  já tem Produtos e Estoque cacheados localmente (SQLite), mas só acessível
  via CLI/skill, desconectado do MCP. Esta é a prova de conceito de conectar
  os dois — cache dentro do MCP primeiro, skill/CLI de OP fica pra depois.

---

## Prompt

```
Vamos trabalhar numa tarefa neste repo (omie-mcp) usando o plugin
superpowers, que já está instalado globalmente e é a primeira opção de
workflow deste projeto — não uma alternativa.

Já existem spec e planos aprovados de uma sessão anterior — NÃO refaça
brainstorming nem writing-plans, vá direto pra execução:

1. Leia `docs/superpowers/specs/2026-08-07-cache-mcp-op-design.md` (spec,
   contexto e decisões já tomadas).
2. Execute `docs/superpowers/plans/2026-08-07-pnpm-workspace-cleanup.md`
   (3 tasks) primeiro — é pré-requisito do plano 2.
3. Depois execute `docs/superpowers/plans/2026-08-07-cache-mcp-op.md`
   (12 tasks) — módulo de Ordem de Produção.

Modo de execução: Subagent-Driven (superpowers:subagent-driven-development).
Uma task por subagente fresco, worktree isolado, dispatcher revisa spec +
qualidade entre tasks, revisão final de branch inteira ao fim de CADA
plano (dois planos = duas revisões finais, uma por plano, já que são dois
plan-files separados mesmo rodando na mesma branch/worktree).

Preferências de processo já estabelecidas neste projeto:
- Nunca trabalhar direto numa branch principal sem meu consentimento
  explícito — sempre branch nova ou worktree.
- Se o worktree for criado a partir de uma branch de trabalho (não
  main/master), usar o HEAD local dessa branch como base — nunca partir de
  origin/main se isso descartar commits locais ainda não publicados.
- TDD sempre: nenhum código de implementação sem teste que falhou primeiro
  (com a exceção documentada no próprio plano 2 pra arquivos de "fiação"
  do servidor MCP, tipo `ordem-producao-tools.ts` — sem precedente de teste
  unitário nesse tipo de arquivo neste repo).
- Rodar a suíte inteira + build de AMBOS os pacotes (raiz via pnpm,
  packages/omie-data via npm — cada um com seu próprio gerenciador,
  conforme o plano 1 estabelece) antes de cada commit.
- Um commit por mudança coerente (task do plano), nunca acumular várias
  mudanças não relacionadas num commit só. Mensagem de commit explica o
  "porquê", não só o "o quê".
- Revisão de task nunca pula: conformidade de spec E qualidade de código.
- Não fazer scope creep: se durante a implementação eu pedir algo fora do
  escopo do plano atual, registrar como task nova/decisão separada, ou
  perguntar antes de misturar no que já está em andamento.
- Ao final, sempre apresentar as opções de finalizar branch (merge local /
  push+PR / manter como está) — nunca decidir sozinho por mim.
- Antes de fixar nomes de campo/formato de requisição pra qualquer chamada
  real da API Omie, conferir contra um gateway já funcionando no servidor
  MCP principal (src/modules/<modulo>/infrastructure/gateways/*.ts) em vez
  de inventar a partir de doc pública — já causou bug de produção (HTTP
  500) no módulo de Estoque, e o plano 2 tem uma nota específica pra
  `listarOrdensProducaoPagina` sobre isso.

Achados de ambiente conhecidos (evitar repetir a investigação):
- `packages/omie-data` usa `npm` nos próprios scripts (test/build), mesmo
  dentro de um workspace pnpm — isso é intencional, não corrigir.
- `vitest.config.ts` do `omie-data` não exclui `dist/` do glob de testes —
  sempre rodar `rm -rf dist` antes de `npm test` dentro do pacote, senão a
  contagem de testes aparece dobrada (falso positivo).
- `packages/shared` na raiz pertence a um projeto totalmente diferente
  (labarr-api) que compartilha o mesmo `pnpm-workspace.yaml` — nunca tocar
  nesse pacote, mesmo que apareça no `pnpm install`.

Agora: execute os dois planos, em ordem, do jeito descrito acima.
```

---

## Notas de manutenção deste prompt

- Este prompt assume que a spec e os DOIS planos já existem e foram
  aprovados — se algo neles precisar mudar, edite os arquivos originais
  antes de rodar esta sessão, não confie só neste prompt pra desviar do que
  está escrito lá.
- Se o plano 1 (pnpm workspace cleanup) já tiver sido executado numa sessão
  anterior, pule direto pro plano 2 — confira `git log` procurando os
  commits com mensagem `"chore: reinstalar node_modules..."` /
  `"feat: conectar omie-data como dependência..."` pra saber se já rodou.
- Ligado a [[project_omie_data_modulo_estoque_pendente]] (padrão que este
  módulo de OP replica) na memória.
