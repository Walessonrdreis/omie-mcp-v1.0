# Pedido de venda — leitura

`ListarPedidos` e `ConsultarPedido`, no recurso `produtos/pedido`.

← [Pedido de venda](README.md) · [Índice](../README.md)

Envelope padrão de
[../convencoes/request-auth.md](../convencoes/request-auth.md):
`POST https://app.omie.com.br/api/v1/produtos/pedido/`, com `call`, `app_key`,
`app_secret` e `param` (array de um objeto).

Dialeto **snake** no envelope e nos dados ✅. Nada de húngaro aqui — com uma
exceção, o bloco `infoCadastro`, que usa `dInc`/`hInc`/`uInc`; ver
[campos.md](campos.md).

## `ListarPedidos`

| Parâmetro | Tipo | Obrigatório | O que faz |
|---|---|---|---|
| `pagina` | number | ✅ sim | Página, 1-indexada |
| `registros_por_pagina` | number | ✅ sim | Tamanho da página — teto de 100 ✅ |
| `etapa` | string | ✅ não | Código da etapa; catálogo em [etapas.md](etapas.md) |
| `filtrar_por_cliente` | number | ✅ não | `codigo_cliente` — **não** é `codigo_cliente` |
| `filtrar_por_vendedor` | number | ✅ não | `codVend` |
| `filtrar_por_data_de` / `_ate` | string | ✅ não | Recorte por `data_previsao`, `dd/mm/aaaa` |
| `apenas_importado_api` | string | ✅ não | `"S"`/`"N"` — aqui **filtra de verdade** |
| `apenas_resumo` | string | ✅ não | `"S"` corta o payload em 7× |

```json
{
  "call": "ListarPedidos",
  "app_key": "SUA_APP_KEY",
  "app_secret": "SEU_APP_SECRET",
  "param": [{
    "pagina": 1,
    "registros_por_pagina": 100,
    "etapa": "20",
    "apenas_resumo": "S"
  }]
}
```

O array de resposta chama-se `pedido_venda_produto` ✅ — cada recurso da Omie
escolhe um nome diferente, ver
[../convencoes/paginacao.md](../convencoes/paginacao.md).

Ao contrário de [ordem de produção](../ordem-producao/leitura-filtros.md), onde
só `cConcluida` existe, **aqui os filtros são reais**: cliente, vendedor e data
recortam de verdade. Os oito nomes recusados e os números de cada filtro estão
em [leitura-filtros.md](leitura-filtros.md).

## A resposta é pesada

Dez blocos e cerca de **230 campos por pedido** ✅, a maioria fiscal. O custo
medido em 10/08/2026:

| Chamada | Bytes |
|---|---|
| 1 pedido, completo | 9 KB a 30 KB, conforme o número de itens |
| Página de 100, completa | **165 KB** |
| 1 pedido, `apenas_resumo: "S"` | **1,7 KB** |

Varrer os 3607 pedidos custa 37 requisições ✅ e cerca de **6 MB** de JSON.

### `apenas_resumo: "S"` — o filtro que ninguém documenta

Descarta quatro blocos e mantém seis ✅:

| Mantém | Descarta |
|---|---|
| `cabecalho`, `infoCadastro`, `informacoes_adicionais` | `det[]` — os itens |
| `frete`, `exportacao`, `observacoes` | `total_pedido`, `lista_parcelas`, `departamentos` |

No mesmo pedido, 11 972 → 1 732 bytes ✅. Para qualquer pergunta que não seja
"o que tem dentro do pedido" — contagem por etapa, fila de separação, quem
comprou —, é o parâmetro certo. Ele **não** é aceito em `ConsultarPedido` ✅.

## `ConsultarPedido`

Param é a chave direto na raiz, `codigo_pedido` **ou**
`codigo_pedido_integracao` 🔧 (`pedido-venda-omie-gateway.ts:70-77`). Os dois
funcionam ✅:

```json
{
  "call": "ConsultarPedido",
  "app_key": "SUA_APP_KEY",
  "app_secret": "SEU_APP_SECRET",
  "param": [{ "codigo_pedido": 9178002521 }]
}
```

A resposta vem embrulhada em `pedido_venda_produto` — aqui um **objeto**, não um
array ✅. O mesmo nome do array da listagem, com outro tipo.

Ao contrário de `cCodIntOP` na OP, que vem `""` em toda a conta,
`codigo_pedido_integracao` **é usado de verdade** aqui ✅: pedidos vindos de
marketplace trazem valores como `"OH14833321"` ou `"162473473"`.

Pedido inexistente devolve `Client-105`, não `Client-103` ✅:

```
SOAP-ENV:Client-105
ERROR: Pedido não cadastrado para o Código [1] !
```

### A consulta devolve **menos** que a listagem

O padrão da Omie — e o que
[../convencoes/tipos-formatos.md](../convencoes/tipos-formatos.md) descreve para
produtos — é a consulta trazer mais que a listagem. Aqui é o contrário ✅.

Comparados os dois métodos no mesmo pedido: 280 caminhos na listagem contra 226
na consulta, e **nada** que só a consulta traga ✅.

A regra é simples: **a consulta omite todo campo vazio ou zerado**; a listagem os
devolve preenchidos com `""` ou `0`.

| Campo | Listagem | Consulta |
|---|---|---|
| `total_pedido.valor_icms` | `0` | ausente |
| `frete.valor_frete` | `0` | ausente |
| `informacoes_adicionais.contato` | `""` | ausente |
| `cabecalho.codigo_empresa` | `9084171408` | **ausente** ✅ |

Só `codigo_empresa` some tendo valor. Todo o resto que desaparece estava vazio.

Consequência prática: `pedido.total_pedido.valor_icms.toFixed(2)` funciona sobre
a listagem e quebra sobre a consulta. Ver [armadilhas.md](armadilhas.md).

## O laço

Páginas são 1-indexadas; `pagina: 0` é tratada como `1` ✅, sem erro. Pedir uma
página além do fim devolve erro, não lista vazia ✅:

```
SOAP-ENV:Client-5113
ERROR: Não existem registros para a página [99999]!
```

Comportamento idêntico ao de `produtos/op`. Pare por `total_de_paginas` e trate
o `Client-5113` como "acabou" — ver
[../convencoes/erros.md](../convencoes/erros.md).

## Próximo

- [leitura-filtros.md](leitura-filtros.md) — os cinco que filtram e os oito que
  não existem
- [etapas.md](etapas.md) — o catálogo, e o achado que ele produziu sobre a OP
- [campos.md](campos.md) — os dez blocos
- [armadilhas.md](armadilhas.md) — o que morde
