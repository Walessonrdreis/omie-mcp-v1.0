# Ordem de produção — campos da resposta

Envelope de `ListarOrdemProducao` e os quatro blocos de cada OP, no recurso
`produtos/op`.

← [Ordem de produção](README.md) · [Índice](../README.md)

A coluna "Sempre vem?" foi verificada em 10/08/2026 contra a conta real, em
listagens de páginas diferentes e em duas consultas — uma OP de 2024 e uma de
2026.

Os insumos (`itensDetalhes[]`) têm página própria, porque o que eles fazem com
a quantidade merece explicação: [campos-itens.md](campos-itens.md).

## Envelope da listagem

Dialeto **snake**, ao contrário dos campos de dados — ver
[../convencoes/paginacao.md](../convencoes/paginacao.md).

| Campo | Tipo | Sempre vem? | Significado |
|---|---|---|---|
| `pagina` | number | ✅ sim | Página devolvida |
| `total_de_paginas` | number | ✅ sim | Total de páginas no recorte pedido |
| `registros` | number | ✅ sim | Quantas OPs vieram **nesta** página |
| `total_de_registros` | number | ✅ sim | Total de OPs no recorte pedido |
| `cadastros` | array | ✅ sim | As OPs — blocos abaixo |

`ConsultarOrdemProducao` devolve **o objeto direto, sem envelope** ✅ — os
mesmos quatro blocos, mais `itens` e `itensDetalhes`.

## Bloco `identificacao`

| Campo | Tipo | Sempre vem? | Significado | Sinônimo |
|---|---|---|---|---|
| `nCodOP` | number | ✅ sim | ID interno da OP | — |
| `cCodIntOP` | string | ✅ sim, sempre `""` | Código de integração da OP | `codigo_produto_integracao` (produtos), mas de outra entidade |
| `cNumOP` | string | ✅ sim | Número visível, `"2026/01863"` | — |
| `nCodProduto` | number | ✅ sim | Produto a produzir — **só o ID** | `codigo_produto` (produtos) |
| `nQtde` | number | ✅ sim | Quantidade planejada do pai | `quantidade` (pedido) |
| `dDtPrevisao` | string | ✅ sim | Data prevista, `dd/mm/aaaa` | — |
| `codigo_local_estoque` | number | ✅ sim | Local onde o produto acabado entra | — |

Três observações que valem mais que a tabela:

1. **`nCodProduto` vem cru, sem descrição nem SKU** ✅. É o custo central do
   recurso — ver [leitura.md](leitura.md).
2. `cCodIntOP` veio `""` em **toda** a amostra ✅, embora a interface o declare
   obrigatório 🔧 (`op-gateway.ts:3`). Não sirva de chave.
3. `codigo_local_estoque` aqui é o local do **produto acabado**, e ele não é
   necessariamente o local dos insumos — ver
   [campos-itens.md](campos-itens.md).

O bloco mistura estilos no mesmo objeto: seis campos húngaros e um snake
(`codigo_local_estoque`) ✅ — ver [../glossario/campos.md](../glossario/campos.md).

## Bloco `infAdicionais`

| Campo | Tipo | Sempre vem? | Significado | Sinônimo |
|---|---|---|---|---|
| `cEtapa` | string | ✅ sim | Código da etapa no kanban; traduzível fora do recurso | `etapa` (pedido de venda) |
| `dDtInicio` | string | ✅ sim | Data de início | — |
| `dDtConclusao` | string | ✅ sim | Data de conclusão prevista | — |
| `nCodProjeto` | number | ✅ sim | Projeto vinculado; `0` = nenhum | — |

`cEtapa` é o campo mais importante do bloco, e o recurso não o traduz: vem só o
código ✅ — `"10"`, `"20"`, `"30"`, `"40"` em OPs abertas e `"60"`, `"80"` em
concluídas. **O catálogo existe, em outro recurso**: `produtos/etapafat`,
operação `"28"`, onde `"10"` é "FABRICA" e `"60"` é "Concluído" nesta conta ✅.
Ver [../pedido-venda/etapas.md](../pedido-venda/etapas.md) e
[armadilhas.md](armadilhas.md).

`nCodProjeto: 0` em toda a amostra ✅ — esta conta não usa projetos.

## Bloco `outrasInf` — três campos declarados, nove entregues

A interface declara três 🔧 (`op-gateway.ts:23-27`); a API devolve **nove** ✅:

| Campo | Tipo | Sempre vem? | Significado |
|---|---|---|---|
| `cConcluida` | string | ✅ sim | `"S"`/`"N"` — o único filtro do recurso |
| `dInclusao` / `hInclusao` | string | ✅ sim | Data e hora de criação da OP |
| `dAlteracao` / `hAlteracao` | string | ✅ sim | Data e hora da última alteração |
| `dConclusao` / `hConclusao` | string | ✅ sim, `""` quando não concluída | Data e hora da conclusão |
| `uInc` / `uAlt` | string | ✅ sim | Código do usuário Omie que incluiu/alterou |

Os seis campos de auditoria (`h*`, `dAlteracao`, `uInc`, `uAlt`) **não estão na
interface do repo** 🔧 e vieram em todos os registros observados ✅. É o mesmo
padrão do bloco `info` de [../produtos/campos.md](../produtos/campos.md) e da
auditoria por linha de [../estrutura/campos.md](../estrutura/campos.md): o
usuário vem como código interno (`P000823983`), não como nome ✅.

Campo de data ausente não existe aqui: em OP aberta, `dConclusao` e `hConclusao`
vêm como **string vazia** ✅, não `undefined`.

E a recíproca não vale: **`dConclusao` preenchida não significa OP concluída**.
Entre três OPs abertas inspecionadas, uma trazia `dConclusao: "25/08/2025"` com
`cConcluida: "N"` ✅. Derive o estado de `cConcluida` e de mais nada — a data
sozinha classifica errado.

`uInc` varia entre usuários da conta (`P000823983`, `P001230276`) ✅, então serve
para saber quem lançou a OP.

**`cConcluida` é o que separa "chão de fábrica" de "arquivo morto"**: 63 OPs
abertas contra 1659 concluídas nesta conta ✅. Como filtrar por ele está em
[leitura-filtros.md](leitura-filtros.md).

## Bloco `observacoes`

| Campo | Tipo | Sempre vem? | Significado |
|---|---|---|---|
| `cObs` | string | ✅ sim, sempre `""` | Observação livre da OP |

A interface declara `observacoes` como opcional e **só em
`OrdemProducaoDetalhada`** 🔧 (`op-gateway.ts:65-66`) — ou seja, como se fosse
exclusivo da consulta. Na prática **a listagem também traz o bloco** ✅, em todos
os registros. Código que só espera `observacoes` na consulta funciona; código que
usa a presença do bloco para distinguir listagem de consulta, não.

Veio `{ "cObs": "" }` em toda a amostra ✅ — presente e vazio, como o
`observacoes` de estrutura.

## Próximo

- [campos-itens.md](campos-itens.md) — os insumos, e por que a quantidade deles
  já vem multiplicada
- [leitura.md](leitura.md) — como pedir esses campos e o que custa
- [armadilhas.md](armadilhas.md) — o que morde
