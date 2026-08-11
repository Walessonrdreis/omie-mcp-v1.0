# Pedido de venda — campos da resposta

Os dez blocos de um pedido, no recurso `produtos/pedido`.

← [Pedido de venda](README.md) · [Índice](../README.md)

A coluna "Sempre vem?" foi verificada em 10/08/2026 contra a conta real, numa
amostra de 100 pedidos de etapas diferentes e em duas consultas ✅.

**Antes de usar esta página:** os campos abaixo descrevem a **listagem**. A
consulta omite tudo que estiver vazio ou zerado ✅ — ver
[leitura.md](leitura.md).

## Envelope da listagem

Dialeto **snake** ✅ — ver [../convencoes/paginacao.md](../convencoes/paginacao.md).

| Campo | Tipo | Sempre vem? | Significado |
|---|---|---|---|
| `pagina` | number | ✅ sim | Página devolvida |
| `total_de_paginas` | number | ✅ sim | Total de páginas no recorte pedido |
| `registros` | number | ✅ sim | Quantos pedidos vieram **nesta** página |
| `total_de_registros` | number | ✅ sim | Total de pedidos no recorte pedido |
| `pedido_venda_produto` | array | ✅ sim | Os pedidos |

`ConsultarPedido` devolve `pedido_venda_produto` como **objeto**, sem envelope de
paginação ✅ — mesmo nome, outro tipo.

## Os dez blocos

A interface do repo declara quatro 🔧 (`pedido-venda-gateway.ts:13-30`); a API
devolve **dez**, com cerca de 230 campos ✅:

| Bloco | O que carrega | Na interface? |
|---|---|---|
| `cabecalho` | Identificação, cliente, etapa — 19 campos | 🔧 sim, 6 campos |
| `det[]` | Os itens — 8 sub-blocos por item | 🔧 sim, só `produto` |
| `infoCadastro` | Estado e auditoria | 🔧 sim, 2 campos |
| `total_pedido` | 24 totalizadores | 🔧 sim, 1 campo |
| `informacoes_adicionais` | Vendedor, categoria, conta corrente | 🔧 não |
| `frete` | Transportadora, volumes, pesos | 🔧 não |
| `lista_parcelas` | `parcela[]` — vencimento, valor, meio | 🔧 não |
| `departamentos[]` | Rateio por departamento; vazio na maioria | 🔧 não |
| `observacoes` | `obs_venda` | 🔧 não |
| `exportacao` | `nao_exportacao` | 🔧 não |

## Bloco `cabecalho`

Dezenove campos ✅; a interface declara seis 🔧. Os que importam:

| Campo | Tipo | Sempre vem? | Significado | Sinônimo |
|---|---|---|---|---|
| `codigo_pedido` | number | ✅ sim | ID interno do pedido | `nCodOP` (OP), de outra entidade |
| `numero_pedido` | string | ✅ sim | Número visível, `"3416"` | `cNumOP` (OP) |
| `codigo_pedido_integracao` | string | ✅ sim, às vezes `""` | Código de integração | `cCodIntOP` (OP) |
| `codigo_cliente` | number | ✅ sim | ID do cliente | — |
| `data_previsao` | string | ✅ sim | Data prevista, `dd/mm/aaaa` | `dDtPrevisao` (OP) |
| `etapa` | string | ✅ sim | Código da etapa — **traduzível** | `cEtapa` (OP) |
| `quantidade_itens` | number | ✅ sim | Contagem de itens; bate com `det.length` ✅ | — |
| `origem_pedido` | string | ✅ sim | `"ERP"`, `"WIX"`, `"AMZ"`, `"MRC"` | — |
| `codigo_empresa` | number | ✅ sim na listagem, **ausente na consulta** | ID da empresa | — |
| `qtde_parcelas` | number | ✅ sim | Número de parcelas | — |
| `bloqueado` | string | ✅ sim, `"N"` ou `""` | Flag de bloqueio | — |
| `encerrado` | string | ✅ sim, `""` ou `"S"` | Flag de encerramento | — |

Os quatro campos `enc_*` (`enc_data`, `enc_hora`, `enc_motivo`, `enc_user`)
acompanham `encerrado` e vieram `""` em toda a amostra ✅.

Duas armadilhas de tipo neste bloco:

1. **`numero_pedido` é string** ✅ — `"2"`, `"10"`, `"3416"`. Ordenar como texto
   coloca `"10"` antes de `"2"`. Converta antes de ordenar.
2. **`bloqueado` tem três estados, não dois** ✅: `"N"`, `"S"` e `""`. Não é o
   `"S"`/`"N"` limpo que
   [../convencoes/tipos-formatos.md](../convencoes/tipos-formatos.md) descreve —
   compare com o literal, nunca por truthiness.

`codigo_pedido_integracao` é usado de verdade nesta conta ✅ (`"OH14833321"`,
`"162473473"` em pedidos de marketplace), ao contrário de `cCodIntOP` na OP, que
vem `""` sempre. Aqui ele **serve** como chave.

## Bloco `det[]` — os itens

Oito sub-blocos por item ✅; quatro deles vêm como objeto vazio nesta conta
(`combustivel`, `observacao`, `rastreabilidade`, `tributavel`). A interface
declara só `produto` 🔧.

| Sub-bloco | Conteúdo |
|---|---|
| `produto` | 21 campos — o que interessa, tabela abaixo |
| `ide` | `codigo_item`, `codigo_item_integracao`, `simples_nacional` |
| `imposto` | ~120 campos: ICMS, IPI, PIS, COFINS, ISS, IBS/CBS |
| `inf_adic` | Categoria, local de estoque, pesos, flags do item |
| `combustivel`, `observacao`, `rastreabilidade`, `tributavel` | Vazios nesta conta ✅ |

### `det[].produto`

| Campo | Tipo | Sempre vem? | Significado | Sinônimo |
|---|---|---|---|---|
| `codigo_produto` | number | ✅ sim | ID interno do produto | `nCodProduto` (OP) |
| `codigo` | string | ✅ sim | SKU | `cCodigo` (estoque) |
| `descricao` | string | ✅ sim | Descrição | `cDescricao` (estoque) |
| `unidade` | string | ✅ sim | Unidade | `unidProdMalha` (estrutura) |
| `quantidade` | number | ✅ sim | Quantidade pedida | `nQtde` (OP) |
| `valor_unitario` | number | ✅ sim | Preço unitário | `nPrecoUnitario` (estoque) |
| `valor_mercadoria` | number | ✅ sim | Quantidade × unitário, **sem desconto** | — |
| `valor_total` | number | ✅ sim | Linha **com** desconto aplicado | — |
| `percentual_desconto` / `valor_desconto` | number | ✅ sim | Desconto da linha | — |
| `ncm` / `cfop` | string | ✅ sim | Classificação fiscal | — |
| `reservado` | string | ✅ sim | `"S"`/`"N"` — reserva de estoque | — |

**`valor_mercadoria` não é o total da linha** ✅. Num item de 100 × R$ 9,00 com
20% de desconto, `valor_mercadoria` é 900 e `valor_total` é 720. Somar
`valor_mercadoria` para conferir o pedido dá um número maior que o cobrado.

Ao contrário da [listagem de OPs](../ordem-producao/leitura.md), que traz só
`nCodProduto` cru, **aqui o SKU e a descrição vêm junto** ✅ — uma tela de
pedidos não precisa indexar o catálogo antes.

### `det[].inf_adic`

`codigo_local_estoque` aparece **por item** ✅, com o ID real do local — nunca
`0`, como na resposta de estoque. E ele **varia entre pedidos**: os 297 itens da
etapa `"20"` saem todos do local padrão `9169896468`, enquanto os 48 itens
amostrados na etapa `"70"` saem de `9084171539`, que não é o padrão ✅.

Não assuma o local padrão ao cruzar pedido com saldo: leia o do item. Ver
[../glossario/conceitos.md](../glossario/conceitos.md), onde o mesmo cuidado
vale para a posição de estoque.

Três flags de comportamento acompanham o item, todas `"S"`/`"N"` ✅:
`nao_gerar_financeiro`, `nao_movimentar_estoque` e `nao_somar_total`.

## Bloco `infoCadastro` — estado e auditoria

O único bloco em dialeto húngaro dentro de um recurso snake ✅.

| Campo | Tipo | Sempre vem? | Significado |
|---|---|---|---|
| `cancelado` | string | ✅ sim | `"S"`/`"N"` — **cruze com `etapa`** |
| `faturado` | string | ✅ sim | `"S"`/`"N"` |
| `autorizado` | string | ✅ sim | `"S"`/`"N"` — NF-e autorizada |
| `denegado` / `devolvido` / `devolvido_parcial` | string | ✅ sim | `"S"`/`"N"` |
| `dInc` / `hInc` / `uInc` | string | ✅ sim | Inclusão: data, hora, usuário |
| `dAlt` / `hAlt` / `uAlt` | string | ✅ sim | Última alteração |
| `dCan` / `hCan` / `uCan` | string | ✅ **só quando cancelado** | Cancelamento |
| `dFat` / `hFat` / `uFat` | string | ✅ só quando faturado | Faturamento |
| `cImpAPI` | string | ✅ não — 42 de 60 na amostra | Flag de importação por API |

**O número de chaves varia de 12 a 19 conforme o estado do pedido** ✅. Os trios
`d`/`h`/`u` aparecem só quando o evento aconteceu — não vêm vazios, vêm
**ausentes**. É o oposto do que `outrasInf` faz na OP, onde `dConclusao` vem
`""` em OP aberta.

Consequência: `pedido.infoCadastro.dCan.split("/")` quebra em todo pedido não
cancelado. Teste a presença da chave, não o conteúdo.

`uInc` vem como código de usuário (`"P000679624"`) ou como **`"WEBSERVICE"`**
quando o pedido entrou pela API ✅.

## Bloco `total_pedido`

Vinte e quatro totalizadores ✅; a interface declara um 🔧. Os dois que importam:

| Campo | Tipo | Sempre vem? | Significado |
|---|---|---|---|
| `valor_total_pedido` | number | ✅ sim | O valor cobrado |
| `valor_mercadorias` | number | ✅ sim | Soma das linhas **sem** desconto |

Num pedido observado: `valor_mercadorias` 3500 e `valor_total_pedido` 2800 ✅.
Os outros 22 campos são impostos (`valor_icms`, `valor_ibs`, `valor_cbs`, …) e
vieram `0` em toda a amostra desta conta — e por isso **somem na consulta**.

## Bloco `informacoes_adicionais`

| Campo | Tipo | Sempre vem? | Significado |
|---|---|---|---|
| `codVend` | number | ✅ sim | Vendedor; filtro `filtrar_por_vendedor` |
| `codigo_categoria` | string | ✅ sim | Categoria financeira, ex: `"1.01.03"` |
| `codigo_conta_corrente` | number | ✅ sim | Conta corrente do recebimento |
| `consumidor_final` | string | ✅ sim | `"S"`/`"N"` |
| `codProj` | number | ✅ sim | Projeto; `0` = nenhum |
| `contato` / `utilizar_emails` | string | ✅ sim, às vezes `""` | Contato e e-mails |
| `outros_detalhes` | object | ✅ sim, sempre `{}` | Não usado nesta conta |

`codigo_categoria` e `codigo_conta_corrente` são os mesmos campos que a escrita
exige — ver [escrita.md](escrita.md).

## Próximo

- [leitura.md](leitura.md) — como pedir esses campos e o que custa
- [etapas.md](etapas.md) — traduzir `cabecalho.etapa`
- [armadilhas.md](armadilhas.md) — o que morde
