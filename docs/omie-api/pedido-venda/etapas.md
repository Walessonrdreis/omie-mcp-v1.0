# Etapas de faturamento — `produtos/etapafat`

O catálogo que traduz o código de etapa para nome. É um recurso **separado** de
`produtos/pedido`, e ele não serve só ao pedido de venda: cobre onze operações
do ERP, **incluindo a ordem de produção**.

← [Pedido de venda](README.md) · [Índice](../README.md)

## A chamada

```json
{
  "call": "ListarEtapasFaturamento",
  "app_key": "SUA_APP_KEY",
  "app_secret": "SEU_APP_SECRET",
  "param": [{ "pagina": 1, "registros_por_pagina": 50 }]
}
```

Recurso `produtos/etapafat` 🔧 (`pedido-venda-omie-gateway.ts:44-49`), array
`cadastros`, dialeto snake no envelope e **húngaro nos dados** ✅.

Uma chamada devolve tudo: 11 operações e 34 etapas numa página ✅. É catálogo
pequeno e estável — baixe uma vez e guarde.

### Duas surpresas no envelope

1. **`registros` conta etapas, não cadastros** ✅. A resposta traz
   `registros: 34` e `total_de_registros: 34`, mas `cadastros` tem 12 elementos.
   34 é a soma das etapas de todas as operações. Um laço que confia no total do
   envelope conta a coisa errada.
2. **`cadastros[0]` é um objeto vazio** `{}` ✅. O gateway do repo o descarta
   filtrando por `"cCodOperacao" in c` 🔧 (`pedido-venda-omie-gateway.ts:50-52`)
   — não é defensividade gratuita, o elemento vazio vem mesmo.

## A forma de cada entrada

| Campo | Tipo | Sempre vem? | Significado |
|---|---|---|---|
| `cCodOperacao` | string | ✅ sim | Código da operação, ex: `"11"` |
| `cDescOperacao` | string | ✅ sim | Nome da operação, ex: `"Venda de Produto"` |
| `etapas` | array | ✅ sim | As etapas daquela operação |
| `etapas[].cCodigo` | string | ✅ sim | Código da etapa — o que vem no pedido |
| `etapas[].cDescrPadrao` | string | ✅ sim | Nome **padrão da Omie** |
| `etapas[].cDescricao` | string | ✅ sim, às vezes `""` | Nome **desta conta** |
| `etapas[].cInativo` | string | ✅ sim | `"S"`/`"N"` |

**`cDescrPadrao` × `cDescricao` é a distinção que importa.** O primeiro é o nome
que a Omie dá de fábrica; o segundo é o que a conta renomeou. O repo prefere o
customizado e cai para o padrão quando ele vem vazio 🔧
(`pedido-venda-omie-gateway.ts:65`) — é a ordem certa: quem opera o ERP vê o
nome customizado.

## Operação `"11"` — Venda de Produto

O código fixo da venda de produto é `"11"` 🔧
(`pedido-venda-gateway.ts:53-54`), confirmado ao vivo ✅. É essa a operação que
traduz o `cabecalho.etapa` de um pedido:

| `cCodigo` | `cDescrPadrao` (Omie) | `cDescricao` (esta conta) | Inativa? | Pedidos |
|---|---|---|---|---|
| `"00"` | Proposta | Proposta | **sim** | 145 |
| `"10"` | Pedido de Venda | **Orçamento e Proposta** | não | 12 |
| `"20"` | Separar Estoque | Separar Estoque | não | 60 |
| `"50"` | Faturar | Faturar | não | 52 |
| `"60"` | Faturado | Faturado | não | 393 |
| `"70"` | Entrega | Entrega | não | 2945 |
| `"80"` | *(disponível)* | *(disponível)* | **sim** | 0 |

Repare em `"10"`: o padrão da Omie é "Pedido de Venda" e esta conta chamou de
"Orçamento e Proposta" ✅. Exibir `cDescrPadrao` mostraria ao usuário um nome que
ele não reconhece.

E repare em `"00"`: **inativa e com 145 pedidos** ✅. `cInativo: "S"` não implica
etapa vazia — ver [leitura-filtros.md](leitura-filtros.md).

## As onze operações

Todas numa chamada ✅. Os códigos não são sequenciais e a lista mistura vendas,
compras e produção:

| Código | Operação | Etapas |
|---|---|---|
| `"01"` | Venda de Serviço | 7 |
| `"11"` | **Venda de Produto** | 7 |
| `"13"` | Devolução de Venda | 1 |
| `"14"` | Remessa de Produto | 1 |
| `"16"` | Nota Complementar de Saída | 1 |
| `"21"` | Compra de Produto | 7 |
| `"22"` | Compra de Produto (Importação) | 1 |
| `"23"` | Devolução ao Fornecedor | 1 |
| `"24"` | Retorno de Remessa | 1 |
| `"26"` | Nota Complementar de Entrada | 1 |
| `"28"` | **Ordem de Produção** | 6 |

Filtrar pela operação é trabalho seu: a resposta traz todas, e não há parâmetro
para pedir uma só ✅.

## Operação `"28"` — a etapa da OP também está aqui

Esta doc afirmava, até 10/08/2026, que o `cEtapa` de uma ordem de produção não
tinha tradução via API. **Estava errado** ✅ — o catálogo está neste mesmo
endpoint, na operação `"28"`:

| `cCodigo` | `cDescrPadrao` (Omie) | `cDescricao` (esta conta) | OPs |
|---|---|---|---|
| `"10"` | A Produzir | **FABRICA** | 54 |
| `"20"` | Produzindo | **LOJA** | 2 |
| `"30"` | Qualidade | **PEDIDOS GRANDES** | 2 |
| `"40"` | Conferido | **Embalado** | 5 |
| `"60"` | Concluído | Concluído | 1349 |
| `"80"` | Armazenado | Armazenado | 310 |

**A evidência:** varredura completa das 1722 OPs da conta em 10/08/2026 ✅. O
conjunto de valores distintos de `cEtapa` é exatamente
`{10, 20, 30, 40, 60, 80}` — o catálogo da operação `"28"`, sem um único código
fora dele.

Isso reinterpreta dois achados anteriores da OP:

1. **"Cada conta configura nomes próprios"** continua verdade — e é exatamente o
   que `cDescricao` expõe. Esta conta rebatizou quatro das seis etapas, com
   nomes que não são de kanban de produção ("FABRICA", "LOJA",
   "PEDIDOS GRANDES"). A customização era o motivo de parecer intraduzível; é,
   na verdade, o dado que o endpoint entrega.
2. **`"60"` e `"80"` em OPs concluídas** deixa de ser anomalia: são "Concluído"
   e "Armazenado", dois estados pós-conclusão. A numeração **é** ordenada.

Consequência prática: um kanban de produção com os nomes certos custa **uma
chamada a mais**, não um mapa hard-coded na aplicação. Ver
[../ordem-producao/armadilhas.md](../ordem-producao/armadilhas.md).

## Como resolver um código

O par operação + código identifica uma etapa; o código sozinho, não ✅. `"20"` é
"Separar Estoque" na venda de produto, "Requisição" na compra e "LOJA" na ordem
de produção.

```
etapa "20" → operação "11" → "Separar Estoque"
etapa "20" → operação "28" → "LOJA"
```

O repo resolve isso construindo um `Map` só da operação `"11"` 🔧
(`pedido-venda-omie-gateway.ts:60-68`). Quem for exibir etapa de OP precisa do
mesmo mapa para a operação `"28"`.

Baixe o catálogo uma vez por sessão e resolva em memória: `descreverEtapa` por
pedido custaria uma chamada por linha da tela — o mesmo erro de N+1 do nome do
produto em [../ordem-producao/leitura.md](../ordem-producao/leitura.md).

## Próximo

- [leitura-filtros.md](leitura-filtros.md) — filtrar por `etapa` e o que isso
  esconde
- [armadilhas.md](armadilhas.md) — pedido cancelado mantém a etapa
- [../glossario/conceitos.md](../glossario/conceitos.md) — etapa de pedido ×
  etapa de OP
