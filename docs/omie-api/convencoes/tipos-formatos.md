# Tipos e formatos

A Omie não usa os tipos que um JSON moderno usaria. Converta tudo na borda.

← [Índice](../README.md)

## Datas: `dd/mm/aaaa`, sempre string

Nunca ISO 8601, nunca timestamp 🔧:

```json
{ "dDtPrevisao": "15/08/2026" }
```

Vale para todo campo de data, nos dois dialetos de nomenclatura: `dDtPrevisao`,
`dDtInicio`, `dConclusao` (húngaro) e `data_previsao` (snake) 🔧.

Duas armadilhas:

1. **Ordenar como string não funciona** — `"02/01/2026"` vem antes de
   `"15/08/2025"` alfabeticamente. Converta antes de ordenar.
2. **Data vazia é `""`, não `null`** 🔧. Um campo de data que não se aplica vem
   como string vazia — checar `if (data)` funciona; `if (data !== null)` não.

Não há campo de hora nos recursos de chão de fábrica. Onde existe data e hora,
são dois campos separados 🔧.

## Booleanos: `"S"` / `"N"`, sempre string

Não existe `true`/`false` na API 🔧:

```json
{ "cConcluida": "S", "cancelado": "N" }
```

Campos assim nos recursos deste escopo: `cConcluida` (OP), `cancelado` e
`faturado` (pedido), `inativo` (produto) 🔧.

**Alguns têm um terceiro estado: `""`.** Em `produtos/pedido`, `bloqueado`,
`encerrado` e `importado_api` vêm `"N"`, `"S"` **ou** string vazia ✅. Um
`switch` com dois casos deixa esse cair no default.

Cuidado com o truthiness: `"N"` é uma string não-vazia, portanto **truthy** em
JavaScript. `if (pedido.cancelado)` é verdadeiro para pedido **não** cancelado.
Compare sempre com o literal: `pedido.cancelado === "S"`.

Alguns campos usam enums de três letras em vez de `"S"`/`"N"` — `tipo`,
`origem`, `motivo` no ajuste de estoque, por exemplo. Ver
[../estoque/escrita.md](../estoque/escrita.md).

Um caso à parte é `cExibeTodos` de `ListarPosEstoque`: é `"S"`/`"N"` na forma,
mas não é um booleano de exibição — ele troca o universo de registros e ainda
muda o tamanho da página ✅. Ver
[../estoque/leitura-filtros.md](../estoque/leitura-filtros.md).

## Números: JSON number, ponto decimal

Valores e quantidades vêm como número JSON, com ponto 🔧:

```json
{ "valor_unitario": 12.5, "nQtde": 100 }
```

Não vêm como string, não usam vírgula. A formatação pt-BR (`R$ 12,50`) é
trabalho da apresentação, não da API.

**Quantidade pode ser fracionária** 🔧 — produto vendido por peso ou medida tem
`nQtde`/`quantidade` decimal. Não assuma inteiro.

**E pode ser negativa.** Em `estoque/consulta`, `fisico` e `nSaldo` são
negativos na maioria das posições desta conta, com extremo em `-5380` ✅.
Quantidade não é um número natural — `if (qtd)` como teste de "tem estoque?"
acerta por acidente com negativo e erra com zero. Ver
[../estoque/campos.md](../estoque/campos.md).

## IDs: dois tipos, três papéis

Cada registro pode ser identificado de três formas 🔧:

| Papel | Tipo | Quem define | Exemplo (produto) |
|---|---|---|---|
| ID interno | number | Omie | `codigo_produto` |
| Código do usuário | string | Você, no cadastro | `codigo` (SKU) |
| Código de integração | string | Você, na chamada | `codigo_produto_integracao` |

O **código de integração** é a peça mais útil para quem integra: você o define
ao criar o registro e o usa depois como chave, sem precisar guardar o ID que a
Omie gerou. Quase todo recurso aceita os dois como chave alternativa 🔧.

Os nomes desses três papéis mudam completamente por recurso — é o assunto de
[../glossario/campos.md](../glossario/campos.md).

## Campo ausente ≠ `null` ≠ `0`

A distinção que mais causa bug de integração 🔧:

| O que vem | O que significa |
|---|---|
| Campo ausente do JSON | O método não expõe esse dado — **ou o dado está vazio** ✅ |
| `""` ou `0` | O dado existe e está vazio/zerado |
| `null` | Raro na Omie; trate como vazio |

O caso concreto: `ListarProdutos` devolve menos campos que `ConsultarProduto`.
Um campo ausente na listagem **não** significa que o produto não o tem — só que
aquela chamada não o traz.

**E a recíproca não vale.** Em `produtos/pedido` é a **consulta** que devolve
menos: ela omite todo campo vazio ou zerado, enquanto a listagem os entrega como
`""`/`0` ✅. O mesmo pedido tem 280 caminhos pela listagem e 226 pela consulta.
Não existe, portanto, uma regra geral de que consultar traz mais — é por
recurso. Ver [../pedido-venda/leitura.md](../pedido-venda/leitura.md).

A ausência também carrega semântica em alguns blocos: em
`pedido.infoCadastro`, os trios `dCan`/`hCan`/`uCan` e `dFat`/`hFat`/`uFat`
**só existem quando o evento aconteceu** ✅. Ali, chave ausente é um estado, não
uma omissão de payload — e é o oposto da OP, onde `dConclusao` vem `""`.

É por isso que todo `campos.md` desta doc tem a coluna **"Sempre vem?"**.

Caso especial documentado: `quantidade_estoque` vem em `ListarProdutos` e
`ConsultarProduto`, mas **sempre com valor 0** nesta conta — não é fonte
confiável de estoque 🔧
(`src/modules/produtos/infrastructure/gateways/produtos-omie-gateway.ts:16-22`).
Um `0` que significa "não sei", não "zero unidades". A fonte real de saldo é
[../estoque/README.md](../estoque/README.md) — onde o mesmo padrão reaparece:
`nCMC` vem `0` quando o custo não foi calculado ✅.

## Resumo para a borda

Ao traduzir Omie → seu contrato:

| Omie | Seu contrato |
|---|---|
| `"15/08/2026"` | `"2026-08-15"` (ISO) ou `Date` |
| `"S"` / `"N"` | `true` / `false` |
| `""` em data | `null` |
| `codigo_produto` / `nCodProduto` / `nCodProd` | um nome só, estável |

## Próximo

- [../glossario/campos.md](../glossario/campos.md) — o mesmo conceito com nome
  diferente em cada recurso
