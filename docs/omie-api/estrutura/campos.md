# Estrutura — campos da resposta

Campos de `produtosEncontrados[]` em `ListarEstruturas` e de `ConsultarEstrutura`
— as duas devolvem **o mesmo objeto**, só muda o envelope ✅.

← [Estrutura](README.md) · [Índice](../README.md)

Cada objeto tem quatro blocos: `ident` (produto pai), `itens[]` (componentes),
`observacoes` e `custoProducao`. A coluna "Sempre vem?" foi verificada em
10/08/2026 contra a conta real, com `nRegPorPagina: 2`.

O sufixo `Malha` é o que separa os dois primeiros blocos: campo **com** sufixo
fala do componente, campo **sem** sufixo fala do pai — ver
[../glossario/conceitos.md](../glossario/conceitos.md).

## Bloco `ident` — o produto pai

| Campo | Tipo | Sempre vem? | Significado | Sinônimo |
|---|---|---|---|---|
| `idProduto` | number | ✅ sim | ID interno do produto pai | `codigo_produto` (produtos) |
| `codProduto` | string | ✅ sim | SKU do pai | `codigo` (produtos) |
| `descrProduto` | string | ✅ sim | Descrição do pai | `descricao` (produtos) |
| `tipoProduto` | string | ✅ sim | Código do tipo de item (`"04"` nos observados) | `tipoItem` (produtos) |
| `idFamilia` | number | ✅ sim | ID da família | `codigo_familia` (produtos) |
| `codFamilia` | string | ✅ sim | Código da família (`"per"`, `"media"`) | `codInt_familia` (produtos) |
| `descrFamilia` | string | ✅ sim | Nome da família | `descricao_familia` (produtos) |
| `unidProduto` | string | ✅ sim | Unidade do pai (`UND`) | `unidade` (produtos) |
| `pesoLiqProduto` | number | ✅ sim | Peso líquido do pai | `peso_liq` (produtos) |
| `pesoBrutoProduto` | number | ✅ sim | Peso bruto do pai | `peso_bruto` (produtos) |
| `intProduto` | string | ✅ **não** — ausente | Código de integração do pai | `codigo_produto_integracao` (produtos) |

`intProduto` é declarado como obrigatório em `EstruturaProdutoOmie`
(`estrutura-gateway.ts:25-38`) 🔧 mas **não apareceu em nenhum registro** ✅ —
ver [armadilhas.md](armadilhas.md).

Os pesos vêm do cadastro do produto, e podem estar zerados mesmo quando o outro
não está: um dos pais observados trouxe `pesoLiqProduto: 0` com
`pesoBrutoProduto: 0.03` ✅. Não é fonte confiável de peso.

## Bloco `itens[]` — os componentes

| Campo | Tipo | Sempre vem? | Significado | Sinônimo |
|---|---|---|---|---|
| `idMalha` | number | ✅ sim | ID da **linha** da estrutura | — |
| `idProdMalha` | number | ✅ sim | ID do **produto componente** | `codigo_produto` (produtos) |
| `codProdMalha` | string | ✅ sim | SKU do componente | `codigo` (produtos) |
| `descrProdMalha` | string | ✅ sim | Descrição do componente | `descricao` (produtos) |
| `quantProdMalha` | number | ✅ sim | Quantidade do componente por unidade do pai | — |
| `unidProdMalha` | string | ✅ sim | Unidade do componente (`KG`, `UND`) | `unidade` (produtos) |
| `tipoProdMalha` | string | ✅ sim | Código do tipo do componente (`"02"`, `"03"`) | `tipoItem` (produtos) |
| `idFamMalha` | number | ✅ sim | ID da família do componente | `codigo_familia` (produtos) |
| `codFamMalha` | string | ✅ sim | Código da família (`"ref"`, `"emba"`) | `codInt_familia` (produtos) |
| `descrFamMalha` | string | ✅ sim | Nome da família do componente | `descricao_familia` (produtos) |
| `pesoLiqProdMalha` | number | ✅ sim | Peso líquido do componente | `peso_liq` (produtos) |
| `pesoBrutoProdMalha` | number | ✅ sim | Peso bruto do componente | `peso_bruto` (produtos) |
| `percPerdaProdMalha` | number | ✅ sim | Percentual de perda previsto | — |
| `intMalha` | string | ✅ **não** — ausente | Código de integração da **linha** | — |
| `intProdMalha` | string | ✅ **não** — ausente | Código de integração do componente | `codigo_produto_integracao` (produtos) |
| `obsProdMalha` | string | ✅ **não** — ausente | Observação da linha | — |

`idMalha` e `idProdMalha` são a confusão central do recurso — leia
[../glossario/conceitos.md](../glossario/conceitos.md) antes de escrever código
que mexe em item de estrutura.

`quantProdMalha` é por **uma** unidade do pai: `0.031` KG de refinado para uma
barra de 30g ✅. Multiplicar pela quantidade da OP é responsabilidade de quem
consome.

Os três campos ausentes (`intMalha`, `intProdMalha`, `obsProdMalha`) são
declarados como obrigatórios na interface do repo (`estrutura-gateway.ts:6-23`)
🔧 e não vieram em nenhum item ✅. `obsProdMalha` provavelmente é omitido quando
vazio; os dois `int*` nunca foram preenchidos nesta conta.

### Auditoria por item — não modelada no repo

`itens[]` traz seis campos de auditoria que `ItemEstruturaOmie` não declara ✅:

| Campo | Tipo | Sempre vem? | Significado |
|---|---|---|---|
| `dIncProdMalha` / `hIncProdMalha` | string | ✅ sim | Data e hora em que a linha entrou na estrutura |
| `dAltProdMalha` / `hAltProdMalha` | string | ✅ sim | Data e hora da última alteração da linha |
| `uIncProdMalha` / `uAltProdMalha` | string | ✅ sim | Código do usuário Omie que incluiu/alterou |

Formatos conforme
[../convencoes/tipos-formatos.md](../convencoes/tipos-formatos.md):
`DD/MM/AAAA` e `HH:MM:SS`. O usuário vem como código interno (`P000823983`),
não como nome ✅ — igual ao bloco `info` de
[../produtos/campos.md](../produtos/campos.md).

A auditoria é **por linha**, não pela estrutura: dá para saber quando um insumo
específico entrou na ficha técnica.

## Bloco `observacoes`

Declarado como `observacoes?: { obsRelevantes: string }`
(`estrutura-gateway.ts:39-41`) 🔧.

Na prática o bloco **sempre veio presente e sempre veio vazio** (`{}`) ✅ — o
opcional é `obsRelevantes` dentro dele, não o bloco. Código que faz
`estrutura.observacoes?.obsRelevantes.trim()` quebra com `undefined`, porque o
`?.` protege o bloco errado.

## Bloco `custoProducao` — não modelado no repo

| Campo | Tipo | Sempre vem? | Significado |
|---|---|---|---|
| `vGGF` | number | ✅ sim | Gastos gerais de fabricação rateados |
| `vMOD` | number | ✅ sim | Mão de obra direta |

Veio `0` nos dois campos em todos os registros observados ✅ — esta conta não
usa custeio de produção. Não confunda com custo de material: esse não existe
aqui, precisa ser calculado somando `quantProdMalha × custo do componente`.

## Próximo

- [leitura.md](leitura.md) — como pedir esses campos
- [armadilhas.md](armadilhas.md) — os campos que a interface promete e a API não
  entrega
