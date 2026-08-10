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

Existe nos dois sentidos abaixo, eles **não têm relação**, e a diferença é
prática:

**Etapa de Ordem de Produção** (`cEtapa`) — código cru do kanban de produção.
Cada conta Omie configura de 3 a 6 etapas com nomes próprios, e **a API não
expõe endpoint para traduzir o código para o nome** 🔧
(`src/modules/ordemProducao/domain/interfaces/op-gateway.ts:12-18`). Você recebe
`"20"` e não há como descobrir pela API que isso significa "Em usinagem" naquela
conta. Quem precisa exibir o nome tem que manter o mapa fora da Omie.

**Etapa de Pedido de Venda** (`etapa`) — catálogo fixo e documentado,
resolvível por `ListarEtapasFaturamento` no recurso `produtos/etapafat` 🔧
(`src/modules/pedidoVenda/domain/interfaces/pedido-venda-gateway.ts:96-105`).
Aqui o código traduz com confiança.

Mesmo nome, garantias opostas. Ao ler código que fala em "etapa", primeiro
descubra de qual recurso ele veio.

## Local de estoque

`codigo_local_estoque` identifica o depósito/local físico. **`0` significa o
local padrão** 🔧.

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

Para "posso vender?", use o disponível, não o físico. Para "o que o inventário
deve encontrar na prateleira?", use o físico.

Os valores exatos e a relação entre eles serão confirmados ao vivo na fase v2 —
ver `estoque/campos.md`.

## Ordem de Produção

Documento que representa "fabricar N unidades do produto X até a data D". Recurso
`produtos/op` 🔧.

Depende de estrutura: **o produto precisa ter malha cadastrada antes**, senão a
Omie recusa a criação da OP 🔧
(`src/modules/ordemProducao/domain/interfaces/op-gateway.ts:38-42`). A cadeia é
produto → malha → OP.

## Família

Agrupamento de produtos (`codigo_familia` / `idFamilia`). Serve como filtro em
`ListarProdutos` 🔧 e vem repetido dentro da estrutura, tanto para o produto pai
quanto para cada componente 🔧.

## Próximo

- [campos.md](campos.md) — o mesmo conceito com nome diferente em cada recurso
