# Estoque — campos da resposta

Envelope de `ListarPosEstoque` e campos de `produtos[]`, no recurso
`estoque/consulta`.

← [Estoque](README.md) · [Índice](../README.md)

A coluna "Sempre vem?" foi verificada em 10/08/2026 contra a conta real, em seis
chamadas com combinações diferentes de página, local e filtro.

## Envelope

| Campo | Tipo | Sempre vem? | Significado |
|---|---|---|---|
| `nPagina` | number | ✅ sim | Página devolvida |
| `nTotPaginas` | number | ✅ sim | Total de páginas no recorte pedido |
| `nRegistros` | number | ✅ sim | Quantas posições vieram **nesta** página |
| `nTotRegistros` | number | ✅ sim | Total de posições no recorte pedido |
| `dDataPosicao` | string | ✅ sim | Data da posição, `dd/mm/aaaa` |
| `produtos` | array | ✅ sim | As posições — tabela abaixo |

`nRegistros` e `dDataPosicao` **não estão** em `ListarPosEstoqueResponse`
(`estoque-omie-gateway.ts:11-16`) 🔧. O segundo importa: é o eco do parâmetro
homônimo e a única forma de saber a que data a posição se refere — ver
[leitura.md](leitura.md).

## `produtos[]` — uma posição por produto, por local

| Campo | Tipo | Sempre vem? | Significado | Sinônimo |
|---|---|---|---|---|
| `nCodProd` | number | ✅ sim | ID interno do produto | `codigo_produto` (produtos) |
| `cCodigo` | string | ✅ sim | SKU do produto | `codigo` (produtos) |
| `cDescricao` | string | ✅ sim | Descrição do produto | `descricao` (produtos) |
| `cCodInt` | string | ✅ sim, quase sempre `""` | Código de integração do produto | `codigo_produto_integracao` (produtos) |
| `codigo_local_estoque` | number | ✅ sim | Local da posição — vem o **ID real**, nunca `0` | — |
| `fisico` | number | ✅ sim | Saldo físico no local | — |
| `nSaldo` | number | ✅ sim | Saldo disponível no local | — |
| `reservado` | number | ✅ sim | Quantidade comprometida | — |
| `nPendente` | number | ✅ sim | Quantidade prevista, ainda não efetivada | — |
| `nCMC` | number | ✅ sim | Custo médio no local | — |
| `estoque_minimo` | number | ✅ sim | Ponto de reposição cadastrado | — |
| `nPrecoUnitario` | number | ✅ sim | Preço de venda cadastrado | `valor_unitario` (produtos) |

Os três últimos — `cCodInt`, `estoque_minimo` e `nPrecoUnitario` — não estão em
`PosicaoEstoque` (`estoque-gateway.ts:5-16`) 🔧 e vieram em **todos** os
registros observados ✅.

`cCodInt` é o único que costuma vir vazio: `""` em quase toda a amostra, com um
único produto preenchido ✅. Trate como opcional apesar de sempre presente.

### É o endpoint mais rico do chão de fábrica

Uma posição traz SKU, descrição, preço de venda, custo médio, ponto de reposição
e os quatro saldos ✅. Uma tela de inventário ou de valor em estoque se resolve
**só com este recurso**, sem cruzar com `geral/produtos` — o mesmo tipo de
economia que [../estrutura/leitura.md](../estrutura/leitura.md) oferece para
ficha técnica.

O que ele não traz: família, unidade e NCM. Para esses, o cruzamento continua
necessário.

## Os quatro números

A pergunta que cada um responde 🔧 (`estoque-gateway.ts:5-16`):

| Campo | Responde |
|---|---|
| `fisico` | "o que o inventário deve encontrar na prateleira?" |
| `nSaldo` | "posso vender?" |
| `reservado` | "quanto já está comprometido com pedido?" |
| `nPendente` | "quanto está previsto entrar/sair e ainda não aconteceu?" |

**Para "posso vender?", use `nSaldo`. Para inventário, use `fisico`.** É a
resposta que [../glossario/conceitos.md](../glossario/conceitos.md) prometia
para esta fase.

Agora a ressalva que importa mais que a regra: **nesta conta os dois são sempre
iguais** ✅. Em toda a amostra observada — cerca de 150 posições, de páginas
diferentes — `nSaldo === fisico` e `reservado === 0`, sem exceção.

Consequência prática: trocar um pelo outro é um bug **invisível aqui** e que
aparece na primeira conta que reserva estoque. A semântica acima vem do
contrato, não da observação; ela não pôde ser confirmada porque a conta nunca
exercita a diferença.

### `nPendente` não entra no disponível

Este dá para verificar, e o resultado é o oposto do que o nome sugere ✅:

| Produto | `fisico` | `nPendente` | `nSaldo` |
|---|---|---|---|
| `100bm` | 180 | 24 | 180 |
| `42nsbm` | 159 | 119 | 159 |
| `70cupbm` | 174 | 81 | 174 |

`nSaldo` ignora `nPendente` completamente. Quem quiser "disponível considerando
o que está por chegar" precisa somar por conta própria — e decidir se pendente
significa entrada ou saída, porque o campo é um número só, sem sinal de direção.

## `fisico` negativo é o normal, não a exceção

Não assuma `fisico >= 0` ✅. Na primeira página da conta, a maioria das posições
é negativa; o extremo observado foi `-5380`. Isso acontece quando a saída é
registrada sem a entrada correspondente — venda de produto que nunca teve ajuste
ou nota de entrada.

E os valores são **fracionários** ✅: `-23.621`, `-230.5`, `5.5`. Vale para
`fisico`, `nSaldo` e `nCMC`, conforme
[../convencoes/tipos-formatos.md](../convencoes/tipos-formatos.md).

Código que faz `if (posicao.fisico)` para testar "tem estoque?" acerta por
acidente com negativo e erra com zero. Compare explicitamente.

## `nCMC` vem `0` com frequência

O custo médio é `0` em boa parte das posições ✅, inclusive em produtos com
saldo físico positivo. Como em `quantidade_estoque` de produtos, é um `0` que
significa "não calculado", não "custo zero" — ver
[../produtos/armadilhas.md](../produtos/armadilhas.md).

Somar `fisico × nCMC` para chegar ao valor do estoque subestima o total sempre
que essas posições entram na conta. Filtre `nCMC > 0` e informe quantas posições
ficaram de fora.

## Próximo

- [leitura.md](leitura.md) — como pedir esses campos, e o que a varredura custa
- [armadilhas.md](armadilhas.md) — o que morde
