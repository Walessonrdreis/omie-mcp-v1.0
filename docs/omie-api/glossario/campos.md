# Dicionário de campos

O mesmo conceito tem nome diferente em cada recurso da Omie. Esta é a tabela
canônica para traduzir entre eles.

← [Índice](../README.md)

## Como ler

Um conceito por linha, uma coluna por recurso. `—` significa que aquele recurso
não expõe o conceito.

As cinco colunas estão completas: **produtos**, **estrutura**, **estoque**,
**ordem de produção** e **pedido de venda**.

A coluna de estoque cobre os dois sub-recursos, que **não falam o mesmo
dialeto**: onde há dois nomes separados por `/`, o primeiro é de
`estoque/consulta` (leitura, húngaro) e o segundo de `estoque/ajuste` (escrita,
snake) 🔧.

## Tabela

| Conceito | produtos | estrutura | estoque | ordem-producao | pedido-venda |
|---|---|---|---|---|---|
| ID interno do produto | `codigo_produto` | `idProduto` / `idProdMalha` | `nCodProd` / `id_prod` | `nCodProduto` / `nIdProdutoMalha` | `codigo_produto` |
| Código do usuário (SKU) | `codigo` | `codProduto` / `codProdMalha` | `cCodigo` | — | `codigo` |
| Código de integração | `codigo_produto_integracao` | `intProduto` / `intProdMalha` | `cCodInt` | `cCodIntOP` (da OP, não do produto) | `codigo_pedido_integracao` (do pedido) |
| Descrição do produto | `descricao` | `descrProduto` / `descrProdMalha` | `cDescricao` | — | `descricao` |
| Unidade | `unidade` | `unidProduto` / `unidProdMalha` | — | — | `unidade` |
| ID da família | `codigo_familia` | `idFamilia` / `idFamMalha` | — | — | — |
| Descrição da família | `descricao_familia` | `descrFamilia` / `descrFamMalha` | — | — | — |
| Peso líquido | `peso_liq` | `pesoLiqProduto` / `pesoLiqProdMalha` | — | — | `peso_liquido` (do item) |
| Peso bruto | `peso_bruto` | `pesoBrutoProduto` / `pesoBrutoProdMalha` | — | — | `peso_bruto` (do item) |
| Quantidade | — | `quantProdMalha` | `fisico` / `quan` | `nQtde` | `quantidade` |
| Preço de venda | `valor_unitario` | — | `nPrecoUnitario` | — | `valor_unitario` |
| Data | — | — | `dDataPosicao` / `data` | `dDtPrevisao` | `data_previsao` |
| Local de estoque | — | — | `codigo_local_estoque` | `codigo_local_estoque` | `codigo_local_estoque` (por item) |
| Etapa do kanban | — | — | — | `cEtapa` | `etapa` |
| Código de status da resposta | `codigo_status` | `codStatus` | `codigo_status` | `cCodStatus` | `codigo_status` |
| Descrição do status | `descricao_status` | `descrStatus` | `descricao_status` | `cDesStatus` | `descricao_status` |

Duas células da coluna de OP escondem armadilha. `cCodIntOP` é código de
integração **da ordem**, não do produto — é o único recurso onde "integração"
muda de entidade. E `nIdProdutoMalha`, apesar do sufixo, identifica o **produto
componente** (`idProdMalha`), não a linha da estrutura (`idMalha`), que a OP não
expõe ✅ — ver
[../ordem-producao/campos-itens.md](../ordem-producao/campos-itens.md).

A coluna de pedido de venda é a mais fácil de ler, porque quase sempre repete o
nome de produtos: `codigo_produto`, `codigo`, `descricao`, `unidade`,
`valor_unitario` são idênticos ✅. Duas ressalvas, ainda assim:
`codigo_pedido_integracao` identifica o **pedido**, não o produto — mesmo desvio
de entidade do `cCodIntOP` da OP —, e os pesos e o local de estoque vivem **por
item**, dentro de `det[].inf_adic`, não no cabeçalho ✅.

A linha "Etapa do kanban" é nova e vale mais que a célula: os dois nomes saem do
**mesmo catálogo**, `produtos/etapafat`, separados pela operação (`"11"` para
pedido, `"28"` para OP) ✅ — ver [conceitos.md](conceitos.md).

A linha "Quantidade" merece cuidado: em estoque há **quatro** números de
quantidade na leitura (`fisico`, `nSaldo`, `reservado`, `nPendente`), e a tabela
só nomeia o físico. Qual usar para quê está em
[../estoque/campos.md](../estoque/campos.md).

Onde a célula de estrutura tem dois nomes separados por `/`, o primeiro descreve
o **produto pai** e o segundo o **componente** — ver
[conceitos.md](conceitos.md) 🔧.

**Ressalva:** a tabela nomeia o campo, não garante que ele venha. Em
`geral/malha`, `intProduto` e `intProdMalha` (mais o `intMalha`, que não tem
equivalente em produtos) **não aparecem em nenhuma resposta de leitura** ✅,
embora a interface do repo os declare obrigatórios. `intMalha` ainda é exigido
na escrita 🔧. Ou seja: o conceito "código de integração" existe no payload de
entrada da malha, mas não no de saída — ver
[../estrutura/campos.md](../estrutura/campos.md).

Fontes: `src/modules/produtos/domain/interfaces/produtos-gateway.ts:1-11,26-55`
e `src/modules/estrutura/domain/interfaces/estrutura-gateway.ts:6-43` 🔧.

## Padrões de renomeação

Reconhecer o padrão poupa consultar a tabela toda hora.

**1. Três estilos de nomenclatura, um por família de recurso** 🔧

| Estilo | Cara | Recursos |
|---|---|---|
| snake | `codigo_produto`, `valor_unitario` | `geral/produtos` (com uma exceção, abaixo), `produtos/pedido`, `estoque/ajuste` |
| húngaro | `nCodProduto`, `cCodIntOP` | `produtos/op`, `estoque/consulta` |
| camelo abreviado | `idProdMalha`, `descrFamMalha` | `geral/malha` |

Repare que **estoque aparece nas duas primeiras linhas**: `estoque/consulta` é
húngaro e `estoque/ajuste` é snake 🔧. O mesmo produto é `nCodProd` quando você
lê e `id_prod` quando você escreve, e não há um único campo em comum entre os
dois payloads. O estilo é do sub-recurso, não do módulo.

Há ainda casos mistos **dentro do mesmo request**: `ListarPosEstoque` pagina em
húngaro (`nPagina`, `nRegPorPagina`) e recebe o local em snake
(`codigo_local_estoque`) ✅.

`produtos/op` é o mais misto de todos ✅: pagina em **snake**
(`pagina`, `registros_por_pagina`), devolve os dados em **húngaro** (`nCodOP`,
`cEtapa`, `nQtde`) e carrega um `codigo_local_estoque` snake dentro do bloco
húngaro. Três estilos no mesmo objeto — por isso ele aparece nas duas primeiras
linhas da tabela acima, como estoque.

O mesmo dado atravessa os três estilos conforme você percorre a cadeia
produto → malha → OP.

**O estilo é do recurso, não da resposta — com duas exceções conhecidas**, e as
duas são blocos húngaros dentro de recursos snake ✅:

| Recurso | Bloco húngaro | Campos |
|---|---|---|
| `geral/produtos` | `caracteristicas`, só em `ConsultarProduto` | `cNomeCaract`, `cConteudo`, `nCodCaract` |
| `produtos/pedido` | `infoCadastro`, em toda resposta | `dInc`, `hInc`, `uInc`, `dAlt`, `cImpAPI` |

O de pedido é o mais traiçoeiro dos dois, porque o bloco vizinho
(`informacoes_adicionais`) é snake e mistura ainda um `codVend` abreviado ✅. Um
parser que assume snake para o objeto inteiro não dá erro em nenhum dos casos:
os campos simplesmente viram `undefined`. Ver
[../produtos/armadilhas.md](../produtos/armadilhas.md) e
[../pedido-venda/campos.md](../pedido-venda/campos.md).

**2. No estilo húngaro, o prefixo indica o tipo** 🔧

| Prefixo | Tipo | Exemplo |
|---|---|---|
| `n` | número | `nCodProduto`, `nQtde` |
| `c` | string | `cCodIntOP`, `cEtapa` |
| `d` | data | `dDtPrevisao`, `dConclusao` |

Útil ao ler um campo desconhecido: `nCodProjeto` é um número, `cObs` é texto.

**3. Em `geral/malha`, o sufixo `Malha` marca o componente** 🔧

`descrProduto` é o produto pai; `descrProdMalha` é o insumo. Sem o sufixo, o
campo fala do pai.

**4. Status de escrita vem sempre em par código + descrição** 🔧

O nome muda (`codigo_status`/`descricao_status`, `codStatus`/`descrStatus`,
`cCodStatus`/`cDesStatus`), mas a forma é a mesma: um código curto e uma
mensagem legível.

**5. `codigo_produto_integracao` × `cCodIntOP`** 🔧

Ambos são "código de integração", mas de **entidades diferentes**: o primeiro
identifica um produto, o segundo uma ordem de produção. O prefixo/sufixo diz de
qual entidade o campo fala — não assuma que "integração" significa sempre
produto.

## Recomendação para quem integra

Traduza para nomes estáveis na borda e **nunca propague o nome da Omie para
dentro do seu app** 🔧. Um front que conhece `nCodProduto`, `codigo_produto` e
`nCodProd` como coisas diferentes já nasceu com dívida.

Sugestão de nomes neutros:

| Conceito | Nome sugerido |
|---|---|
| ID interno do produto | `produtoId` |
| Código do usuário (SKU) | `produtoSku` |
| Descrição do produto | `produtoDescricao` |
| Quantidade | `quantidade` |
| Unidade | `unidade` |

O modelo completo, com as agregações, sai na fase v3 em
`90-modelo-frontend.md`.

## Próximo

- [conceitos.md](conceitos.md) — o que os termos significam
- [../convencoes/tipos-formatos.md](../convencoes/tipos-formatos.md) — os
  formatos que esses campos carregam
