# Conceitos

O vocabulário da Omie no chão de fábrica, incluindo os termos que significam
coisas diferentes dependendo do recurso.

← [Índice](../README.md)

## Malha

O nome que a Omie dá para **estrutura de produto** — também conhecida como BOM
(*bill of materials*) ou ficha técnica: a lista de insumos que compõem um
produto fabricado.

O recurso é `geral/malha` 🔧, e quase todo campo dele carrega o sufixo `Malha`
(`idProdMalha`, `quantProdMalha`, `descrProdMalha`).

Detalhe que confunde: **o recurso é `geral/`, não `produtos/`**, embora o
conceito seja inteiramente sobre produtos 🔧
(`src/modules/estrutura/infrastructure/gateways/estrutura-omie-gateway.ts:25`).

## Item da malha × produto componente

Duas identidades diferentes dentro da mesma linha de estrutura, e confundi-las é
o erro mais provável do recurso 🔧
(`src/modules/estrutura/domain/interfaces/estrutura-gateway.ts:66-77`):

| Campo | Identifica |
|---|---|
| `idMalha` | A **linha** da estrutura — "o terceiro insumo desta ficha técnica" |
| `idProdMalha` | O **produto** daquela linha — "parafuso M8" |

Se o mesmo insumo aparece duas vezes na mesma ficha, são dois `idMalha`
diferentes com o mesmo `idProdMalha`.

Alterar um item exige **os dois** 🔧, mesmo quando você só quer mudar a
quantidade.

O sufixo do campo diz de quem ele fala: em `geral/malha`, campo com sufixo
`Malha` descreve o **componente**; campo sem sufixo descreve o **produto pai**
🔧. Compare `descrProduto` (o pai) com `descrProdMalha` (o insumo).

## Etapa

Posição de um documento no kanban do ERP. Existe para pedido de venda
(`etapa`, snake) e para ordem de produção (`cEtapa`, húngaro), e **os dois
saem do mesmo catálogo** ✅: `ListarEtapasFaturamento`, no recurso
`produtos/etapafat` — que não pertence a nenhum dos dois.

O catálogo é indexado por **operação + código**, e é a operação que separa os
dois sentidos ✅:

| Operação | Nome | Documento |
|---|---|---|
| `"11"` | Venda de Produto | Pedido de venda 🔧 (`pedido-venda-gateway.ts:53-54`) |
| `"28"` | Ordem de Produção | OP ✅ |

**O código sozinho não identifica nada.** `"20"` é "Separar Estoque" na operação
`"11"`, "LOJA" na `"28"` e "Requisição" na `"21"` (compra). Ao ler código que
fala em "etapa", primeiro descubra de qual recurso ele veio — não para saber se
traduz, mas para saber **por qual operação** traduzir.

Cada conta renomeia as etapas, e o catálogo expõe as duas versões: `cDescrPadrao`
é o nome de fábrica da Omie, `cDescricao` é o desta conta ✅. Prefira o
customizado — nesta conta a etapa `"10"` da OP chama-se "FABRICA", não
"A Produzir".

> **Correção de 10/08/2026.** Até esta data a doc afirmava que a etapa de OP não
> tinha tradução via API, ao contrário da de pedido. Estava errado: a varredura
> completa das 1722 OPs mostra que os valores de `cEtapa` são exatamente o
> catálogo da operação `"28"` ✅.

Catálogo completo e evidência em
[../pedido-venda/etapas.md](../pedido-venda/etapas.md).

Uma diferença real permanece: **filtrar** por etapa. `ListarPedidos` aceita
`etapa` como parâmetro ✅; `ListarOrdemProducao` recusa qualquer variante do nome
com `Client-5001` ✅. Kanban de pedido é uma requisição por coluna; kanban de OP
é varredura mais agrupamento em memória. Ver
[../ordem-producao/leitura-filtros.md](../ordem-producao/leitura-filtros.md).

E cuidado com a etapa do pedido: **cancelar não a reseta** ✅ — 35 dos 60
pedidos em "Separar Estoque" estão cancelados nesta conta. Ver
[../pedido-venda/armadilhas.md](../pedido-venda/armadilhas.md).

## Local de estoque

`codigo_local_estoque` identifica o depósito/local físico. **`0` é um valor
especial de entrada, não um local**: enviar `0` ou omitir o parâmetro dá o mesmo
resultado ✅, e um código inexistente é recusado com `SOAP-ENV:Client-1070` ✅.

**`0` significa "o local padrão", não "todos os locais"** ✅. A conta tem **15
locais cadastrados**, cinco deles ativos, e cada um tem posição própria:
`0` devolve 1353 posições, exatamente o total do local `9169896468` — que é o
único marcado `padrao: "S"` ✅. Os outros locais têm saldo que essa leitura
**não** enxerga (284 posições em `9084171539`, 51 em `9176802789`).

Quem quer o total de um produto na empresa precisa somar as posições de cada
local, uma leitura por local. O catálogo de locais vem de `ListarLocaisEstoque`,
no recurso `estoque/local` — dialeto húngaro, array `locaisEncontrados` ✅. Cada
local traz `padrao`, `inativo` e três flags de uso: `dispVenda`, `dispRemessa` e
`dispOrdemProducao`. Só três locais desta conta aceitam OP ✅ — ver
[../ordem-producao/escrita.md](../ordem-producao/escrita.md).

Na **resposta**, `codigo_local_estoque` nunca vem `0`: vem sempre o ID real do
local ✅. Agrupe pelo valor devolvido, não pelo que você enviou.

O importante: posição de estoque é **sempre por local**. Um produto em três
locais tem três posições, e o "total do produto" não existe na API — precisa ser
somado por quem consome 🔧
(`src/modules/estoque/infrastructure/gateways/estoque-omie-gateway.ts:20-24`).

## Saldo físico, saldo, reservado, pendente

`ListarPosEstoque` devolve quatro números por posição, e eles respondem
perguntas diferentes 🔧
(`src/modules/estoque/domain/interfaces/estoque-gateway.ts:5-16`):

| Campo | Responde |
|---|---|
| `fisico` | Quanto existe no depósito agora |
| `nSaldo` | Quanto está disponível para uso |
| `reservado` | Quanto já está comprometido com pedidos |
| `nPendente` | Quanto está previsto entrar/sair mas não se concretizou |

**Para "posso vender?", use `nSaldo`. Para "o que o inventário deve encontrar na
prateleira?", use `fisico`.**

Duas ressalvas da coleta de 10/08/2026, e a primeira muda como você testa:

1. **Nesta conta os dois são sempre iguais** ✅ — em cerca de 150 posições,
   `nSaldo === fisico` e `reservado === 0`, sem exceção. A conta nunca reserva
   estoque, então a distinção acima vem do contrato 🔧, não da observação.
   Trocar um pelo outro é um bug invisível aqui.
2. **`nPendente` não é descontado do `nSaldo`** ✅. Um produto com `fisico: 180`
   e `nPendente: 24` tem `nSaldo: 180`. Quem quiser "disponível considerando o
   que está por chegar" soma por conta própria.

Detalhes e números em [../estoque/campos.md](../estoque/campos.md).

## Ordem de Produção

Documento que representa "fabricar N unidades do produto X até a data D". Recurso
`produtos/op` 🔧.

Depende de estrutura: **o produto precisa ter malha cadastrada antes**, senão a
Omie recusa a criação da OP 🔧
(`src/modules/ordemProducao/domain/interfaces/op-gateway.ts:38-42`). A cadeia é
produto → malha → OP.

A OP **copia** a malha no momento em que nasce, e a cópia não acompanha
alterações posteriores da ficha técnica ✅. Duas consequências que separam os
dois conceitos: a quantidade de cada insumo na OP já vem multiplicada pela
quantidade produzida (na malha é por unidade), e uma OP antiga não é
reconstituível a partir da malha de hoje. Detalhes em
[../ordem-producao/campos-itens.md](../ordem-producao/campos-itens.md).

## Família

Agrupamento de produtos (`codigo_familia` / `idFamilia`). Serve como filtro em
`ListarProdutos` 🔧 e vem repetido dentro da estrutura, tanto para o produto pai
quanto para cada componente 🔧.

## Próximo

- [campos.md](campos.md) — o mesmo conceito com nome diferente em cada recurso
