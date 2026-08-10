# Estoque — os três parâmetros que mudam o resultado

`nRegPorPagina`, `cExibeTodos` e `dDataPosicao` de `ListarPosEstoque`. Os três
fazem mais do que o nome sugere, e nenhum dos três comportamentos está na doc
oficial.

← [Estoque](README.md) · [leitura.md](leitura.md) · [Índice](../README.md)

Os parâmetros básicos e o laço de paginação estão em [leitura.md](leitura.md).
Esta página cobre só o que surpreende.

## `nRegPorPagina` tem teto silencioso de 100

Pedir mais que 100 **não** dá erro: a Omie devolve 100 e recalcula
`nTotPaginas` de acordo ✅.

| Pedido | `nRegistros` devolvido | `nTotPaginas` |
|---|---|---|
| 1 | 1 | 1353 |
| 2 | 2 | 677 |
| 500 | 100 | 14 |

O repo pede 500 🔧 (`estoque-omie-gateway.ts:18`) e recebe 100 — a varredura
custa 14 requisições, não 3. Nada no código sinaliza isso, porque a paginação
por `nTotPaginas` continua correta.

**Confira o `nRegistros` da resposta em vez de assumir o que você pediu.** Uma
estimativa de tempo baseada no número pedido erra por 5×. Ver
[armadilhas.md](armadilhas.md).

## `cExibeTodos` decide o universo — e ignora o tamanho de página

Faz duas coisas ao mesmo tempo, e a segunda não é documentada em lugar nenhum ✅:

| `cExibeTodos` | `nTotRegistros` | Página efetiva |
|---|---|---|
| omitido ou `"N"` | 1353 | o que você pediu, até 100 |
| `"S"` | 2021 | **50, fixo** — `nRegPorPagina` é ignorado |

Com `"S"` o total bate exatamente com os 2021 produtos do catálogo ✅ (ver
[../produtos/armadilhas.md](../produtos/armadilhas.md)): o padrão esconde **668
produtos** que nunca tiveram movimento.

Para inventário completo, `"S"` é obrigatório — ao custo de 41 páginas em vez
de 14.

Na forma é `"S"`/`"N"`, mas não é um booleano de exibição: troca o conjunto de
registros e o tamanho da página. Ver
[../convencoes/tipos-formatos.md](../convencoes/tipos-formatos.md).

## `dDataPosicao` dá posição retroativa

Aceito na entrada e ecoado na resposta ✅. É o recurso mais subestimado do
endpoint: dá para reconstruir o estoque em qualquer data passada sem manter
histórico próprio.

Comparação do mesmo produto nas duas datas ✅:

| Produto | Em 01/01/2026 | Em 10/08/2026 |
|---|---|---|
| `100bm` | `fisico: 13` | `fisico: 180` |
| Total de posições | 771 | 1353 |

O universo também encolhe: produto que ainda não existia na data não aparece.

Formato `dd/mm/aaaa`, como toda data da Omie — ver
[../convencoes/tipos-formatos.md](../convencoes/tipos-formatos.md).

## Como os três se combinam

O total de páginas de uma varredura depende dos três ao mesmo tempo:

| Objetivo | Parâmetros | Páginas |
|---|---|---|
| Posições com movimento, hoje | `nRegPorPagina: 100` | 14 ✅ |
| Catálogo inteiro, hoje | `cExibeTodos: "S"` | 41 ✅ |
| Posições com movimento, data passada | `nRegPorPagina: 100`, `dDataPosicao` | menos, varia ✅ |

Sempre calcule o custo a partir do `nTotPaginas` da primeira resposta, nunca a
partir do que você pediu.

## Próximo

- [leitura.md](leitura.md) — parâmetros básicos, request e laço
- [campos.md](campos.md) — o que vem na resposta
- [armadilhas.md](armadilhas.md) — o que morde
