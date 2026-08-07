# Prompt reutilizável: implementar módulo de Estoque no omie-data

Cole este prompt no início de uma nova sessão pra executar o módulo de
Estoque no pacote `omie-data` — coleta de `ListarPosEstoque`, enriquecimento
da `view_produtos` com 3 colunas de estoque, e atualização do CLI.

---

## Pré-requisito (verificar antes)

Confira se a reorganização estrutural (Commit 1, Tasks 1–3) já foi feita:

```
ls packages/omie-data/src/modules/produtos/
```

Se não existir `src/modules/produtos/`, execute as Tasks 1–3 do plano
**primeiro** (Commit 1: reorganização), depois as Tasks 4–12.

Confira também se o split das interfaces HTTP (`IProdutosHttpClient` /
`IEstoqueHttpClient`) já está em `src/domain/`. O plano cobre isso nas
Tasks 1–3.

---

## Prompt

```
Execute as Tasks 1–12 do plano `docs/superpowers/plans/2026-08-06-estoque-omie-data.md`
neste repo (omie-mcp), pacote `packages/omie-data/`.

O que cada task cobre:
- Task 1-3 
- Task  4: domínio PosicaoEstoque + tabela raw_estoque + IEstoqueHttpClient
- Task  5: collectEstoque (varre ListarPosEstoque, grava raw_estoque)
- Task  6: alterar translateProdutos (join raw_estoque → 3 colunas na view)
- Task  7: alterar rodarProdutos (coleta estoque antes da tradução)
- Task  8: FakeHttpClient implementa IEstoqueHttpClient
- Task  9: OmieHttpClientReal implementa IEstoqueHttpClient
- Task 10: alterar cli.ts (coluna "Estoque" na tabela formatada)
- Task 11: atualizar consultarProdutos (query reflete as 3 colunas novas)
- Task 12: build + suite completa + revisão final

Modo de execução: Subagent-Driven (superpowers:subagent-driven-development).
Uma task por subagente, worktree isolado, dispatcher revisa entre tasks.

TDD sempre: teste que falha → confirma FAIL → implementa → confirma PASS →
commit. Rodar build + suite antes de cada commit.

Referência pros nomes de campo da API Omie (ListarPosEstoque):
`src/modules/estoque/infrastructure/gateways/estoque-omie-gateway.ts`
no servidor MCP (já existe, NÃO modificar — só usar como referência).

Bug conhecido: npm reintroduz `omie-mcp:file:../..` no package.json do
omie-data. Instalar sempre com `npm install --prefix packages/omie-data`.

Cada task do plano já tem os checkboxes, arquivos envolvidos e snippets de
código — usar aquilo como referência, não reescrever do zero.
```

---

## Notas de manutenção deste prompt

- Se o Commit 1 (Tasks 1–3) já estiver feito quando este prompt for usado,
  pular direto pra Task 4. Senão, fazer Commit 1 primeiro.
- O plano em `docs/superpowers/plans/2026-08-06-estoque-omie-data.md` é a
  fonte autoritativa — se houver conflito entre o prompt e o plano, o plano
  vence.
- Ligado a [[project_omie_data_modulo_estoque_pendente]] na memória.
- `estoque-omie-gateway.ts` no MCP mostra o padrão real: endpoint
  `estoque/consulta`, call `ListarPosEstoque`, paginação com `nPagina`/
  `nRegPorPagina`, resposta em `produtos` (array de posições).
