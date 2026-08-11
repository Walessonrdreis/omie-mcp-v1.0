# Receita 2 — saldo de insumo para uma OP

**A pergunta:** dá para produzir esta OP com o que tem no estoque, e o que falta?

← [Modelo para o frontend](90-modelo-frontend.md) · [Índice](README.md)

É a receita mais cara das três e a que mais tem armadilha por passo. Três coisas
podem dar errado em silêncio, e as três produzem número plausível.

## As três armadilhas, antes da sequência

1. **`nQtde` dos itens da OP já vem multiplicada** pela quantidade da OP ✅.
   Multiplicar de novo infla o consumo — numa OP de 82 unidades, em 82×. Ver
   [ordem-producao/campos-itens.md](ordem-producao/campos-itens.md).
2. **O local do insumo pode não ser o local da OP** ✅. Cada item traz o seu
   `codigo_local_estoque`; na OP `2024/00002` o produto acabado entra em
   `Estoque Fábrica` e os insumos saem de `Insumos Fábrica`.
3. **A varredura padrão de estoque só cobre o local padrão** ✅. A conta tem
   **15 locais**, e `codigo_local_estoque: 0` traz só o principal. Um insumo que
   só existe em `Insumos Fábrica` **não vem zerado — ele não aparece**. Ver
   [estoque/armadilhas.md](estoque/armadilhas.md).

## A sequência

| # | Chamada | Recurso | Param | Devolve |
|---|---|---|---|---|
| 1 | `ConsultarOrdemProducao` | `produtos/op` | `nCodOP` | `itensDetalhes[]`: insumo, quantidade total, local ✅ |
| 2 | `ListarPosEstoque` × N | `estoque/consulta` | `nPagina`, `nRegPorPagina: 100`, `codigo_local_estoque` | posições do local, com `cDescricao` junto ✅ |
| 3 | *(opcional)* `ListarProdutos` | `geral/produtos` | catálogo indexado | nome de insumo que não apareceu no passo 2 |

O passo 2 **repete por local distinto** encontrado no passo 1. Não existe uma
chamada que traga todos os locais de uma vez ✅.

### A estrutura não entra nesta receita

O desenho original mandava passar por `ListarEstruturas` para achar os
componentes. Está errado para uma OP que já existe: os insumos da OP são um
**retrato do dia da criação**, não a ficha técnica de hoje ✅ — numa OP de 2024,
quatro dos seis insumos nem estão mais na estrutura atual.

A estrutura só entra quando a OP **ainda não existe** (simular "quanto preciso
para fabricar N unidades"). Aí sim: `ListarEstruturas`, e aí sim você multiplica
`quantProdMalha` por N.

## O custo

Para a OP `2024/00002`, cujos insumos saem de `Insumos Fábrica`:

| Passo | Requisições |
|---|---|
| `ConsultarOrdemProducao` | 1 |
| Varredura de `Insumos Fábrica` (51 posições) | 1 |
| Nome dos insumos | 0 — vem no passo anterior |
| **Total** | **2** |

Para uma OP com insumos no local padrão (1353 posições), a varredura custa **14
requisições** ✅ — o `nRegPorPagina` tem teto silencioso de 100, então pedir 500
não ajuda. Se os insumos estão espalhados por três locais, some as três
varreduras.

| Local | Posições ✅ | Páginas de 100 |
|---|---|---|
| `9169896468` — Estoque Labarr 711 (padrão) | 1353 | 14 |
| `9084171539` — Estoque Fábrica | 284 | 3 |
| `9176802789` — Insumos Fábrica | 51 | 1 |

**A varredura é o custo dominante, e é reaproveitável.** Um índice de estoque
por `(nCodProd, codigo_local_estoque)` derruba esta receita para 1 requisição —
é o caso mais forte a favor da camada própria, ver
[91-gaps-camada-propria.md](91-gaps-camada-propria.md).

## O shape agregado

Estrutura sugerida sobre a OP `2024/00002`; os números de quantidade e os
códigos são os observados ✅, os textos são ilustrativos.

```json
{
  "geradoEm": "2026-08-10T21:00:00Z",
  "opId": "<nCodOP da OP>",
  "opNumero": "2024/00002",
  "produtoId": 9116172062,
  "quantidade": 132,
  "cobertura": "parcial",
  "insumos": [
    {
      "produtoId": 9200405266,
      "produtoSku": "<codigo do insumo>",
      "produtoDescricao": "<cDescricao da posicao de estoque>",
      "necessario": 1.056,
      "localId": 9176802789,
      "localNome": "Insumos Fábrica",
      "disponivel": 3.2,
      "faltante": 0,
      "saldoConhecido": true
    }
  ]
}
```

### As regras de cálculo

| Campo | Regra |
|---|---|
| `necessario` | `nQtde` do item, **sem multiplicar** ✅ |
| `disponivel` | `fisico` da posição, no `localId` **do item** — não no da OP ✅ |
| `faltante` | `max(0, necessario - disponivel)`, só quando `saldoConhecido` |
| `saldoConhecido` | `false` quando o insumo não apareceu na varredura daquele local |
| `cobertura` | `"completa"` se todo insumo tem saldo conhecido e `faltante: 0` |

### `saldoConhecido` é o campo que evita o erro caro

Insumo ausente da varredura **não é insumo zerado** ✅ — pode nunca ter tido
movimento naquele local, ou o local pode não ter sido varrido. Tratar ausência
como zero faz a tela dizer "falta tudo" quando o material está na prateleira.

Se você precisa cobrir produto sem movimento, `cExibeTodos: "S"` inclui o
catálogo inteiro — ao custo de página fixa em 50 e 41 requisições ✅. Ver
[estoque/leitura-filtros.md](estoque/leitura-filtros.md).

### `fisico`, não `nSaldo`

Para "tem material na prateleira?", a semântica certa é `fisico`. Nesta conta os
dois são sempre iguais e `reservado` é sempre `0` ✅, então trocar um pelo outro
é um bug **invisível aqui** — e que aparece na primeira conta que reserva
estoque.

Lembre que `fisico` negativo e fracionário é normal ✅: compare com `> 0`
explicitamente, nunca com um teste de veracidade.

## Próximo

- [90-receita-separacao.md](90-receita-separacao.md) — a receita 3
- [ordem-producao/campos-itens.md](ordem-producao/campos-itens.md) — os insumos
- [estoque/leitura.md](estoque/leitura.md) — o custo real da varredura
