# Ordem de produção — os insumos da OP

`itensDetalhes[]`, devolvido só por `ConsultarOrdemProducao`. É a lista de
insumos que aquela OP consome, e ela **não é a estrutura do produto** — é uma
cópia dela, congelada no dia em que a OP nasceu.

← [Ordem de produção](README.md) · [campos.md](campos.md) · [Índice](../README.md)

## Campos de cada item

Quatro declarados na interface 🔧 (`op-gateway.ts:67-72`), seis entregues ✅:

| Campo | Tipo | Sempre vem? | Significado | Sinônimo |
|---|---|---|---|---|
| `nIdProdutoMalha` | number | ✅ sim | ID do **produto** componente | `idProdMalha` (estrutura) |
| `nQtde` | number | ✅ sim | Quantidade **total** do insumo nesta OP | `quantProdMalha` × `nQtde` da OP |
| `codigo_local_estoque` | number | ✅ sim | Local de onde o insumo sai | — |
| `cObs` | string | ✅ sim, sempre `""` | Observação da linha | — |
| `cUtilizarDoEstoque` | string | ✅ sim — não declarado 🔧 | Flag `"S"`/`"N"`; `"N"` em toda a amostra | — |
| `info` | objeto | ✅ sim — não declarado 🔧 | Auditoria da linha: `dInc`/`hInc`/`dAlt`/`hAlt`/`uInc`/`uAlt` | `info` (produtos) |

O nome engana: **`nIdProdutoMalha` é o produto componente, não a linha da
estrutura** ✅. O equivalente é `idProdMalha`, não `idMalha` — e a linha
(`idMalha`) não aparece em lugar nenhum da OP. Ver
[../glossario/conceitos.md](../glossario/conceitos.md).

Consequência: se o mesmo insumo aparece duas vezes na ficha técnica, a OP não dá
como distinguir as duas ocorrências. Só sobra a quantidade somada.

`cUtilizarDoEstoque` veio `"N"` em todos os itens das duas OPs consultadas ✅. O
nome sugere "baixar este insumo do estoque", mas **o efeito não foi verificado** —
nenhuma escrita foi executada, e o campo não existe na interface do repo.

## `nQtde` já vem multiplicada pela quantidade da OP

O achado que evita o erro mais caro do recurso ✅.

`quantProdMalha`, na estrutura, é por **uma** unidade do pai — ver
[../estrutura/campos.md](../estrutura/campos.md). Na OP, não: o número já é o
consumo total. Conferido item a item na OP `2026/01863`, de 82 unidades do
produto `9116172204` ✅:

| Insumo | `quantProdMalha` (estrutura) | × 82 | `nQtde` (OP) |
|---|---|---|---|
| `9207255160` — refinado | 0,08 | 6,56 | **6,56** |
| `9209343668` — castanha | 0,016 | 1,312 | **1,312** |
| `9392626607` — embalagem | 1 | 82 | **82** |

Os três batem exatamente. **Multiplicar de novo pela quantidade da OP infla o
consumo em 82×** — e o erro é silencioso, porque o número continua plausível.

A regra prática: quem lê a **estrutura** multiplica; quem lê os **itens da OP**
não. As duas fontes falam a mesma língua (`KG`, `UND`) e diferem só nisso.

## Os itens são um retrato do dia da criação

A OP **não reflete a estrutura atual do produto** ✅. Comparação da OP
`2024/00002` (132 unidades do produto `9116172062`) com a ficha técnica do mesmo
produto hoje:

| Comparação | OP de 08/07/2024 | Estrutura em 10/08/2026 |
|---|---|---|
| Nº de insumos | 6 | 4 |
| Insumos em comum | 2 | 2 |
| Consumo unitário de `9200405266` | 0,008 (1,056 ÷ 132) | 0,008568 |

A estrutura foi alterada em 07/08/2026 (`dAltProdMalha`) ✅ e a OP de 2024
continua com os números antigos. Quatro dos seis insumos daquela OP nem estão
mais na ficha técnica.

Isso é o comportamento **desejável** de um documento de produção — o histórico
não deve mudar quando o engenheiro corrige a receita. Mas quebra duas suposições
comuns:

- **Não dá para reconstruir o consumo de uma OP antiga a partir da estrutura.**
  Só `ConsultarOrdemProducao` sabe o que aquela OP consumiu.
- **A soma dos itens da OP não valida contra a ficha técnica atual.** Um teste
  que compara os dois quebra sozinho na primeira alteração de receita.

Para OP recém-criada os dois coincidem, e é por isso que o bug demora a
aparecer.

## O local dos insumos é outro campo

Cada item traz o **seu** `codigo_local_estoque`, e ele pode ser diferente do
local da OP ✅:

| OP | Local do produto acabado | Local dos insumos |
|---|---|---|
| `2024/00002` | `9084171539` (Estoque Fábrica) | `9176802789` (Insumos Fábrica) |
| `2026/01863` | `9169896468` (Estoque Labarr 711) | `9169896468` (o mesmo) |

Faz sentido no chão de fábrica — insumo sai de um depósito, produto acabado
entra em outro — e obriga quem calcula disponibilidade a consultar o saldo **no
local do item**, não no local da OP. Ver
[../estoque/leitura.md](../estoque/leitura.md).

## `itens` vem `null`

A consulta devolve, além de `itensDetalhes`, um campo `itens: null` ✅ que não
existe na interface do repo 🔧 e veio nulo nas duas consultas. Provavelmente é o
formato antigo da mesma lista. **Use `itensDetalhes`**; um `?? []` em cima de
`itens` devolve lista vazia e nenhum erro.

## Próximo

- [campos.md](campos.md) — os quatro blocos da OP
- [armadilhas.md](armadilhas.md) — inclusive as duas armadilhas desta página
- [../estrutura/README.md](../estrutura/README.md) — a ficha técnica de onde
  estes itens foram copiados
