# Ordem de produção — leitura

`ListarOrdemProducao` e `ConsultarOrdemProducao`, no recurso `produtos/op`.

← [Ordem de produção](README.md) · [Índice](../README.md)

Envelope padrão de
[../convencoes/request-auth.md](../convencoes/request-auth.md):
`POST https://app.omie.com.br/api/v1/produtos/op/`, com `call`, `app_key`,
`app_secret` e `param` (array de um objeto).

Dialeto **snake** de paginação (`pagina`, `registros_por_pagina`) ✅ — mas os
campos de dados são húngaros. O recurso troca de estilo entre o envelope e o
conteúdo; ver [../glossario/campos.md](../glossario/campos.md).

## `ListarOrdemProducao`

| Parâmetro | Tipo | Obrigatório | O que faz |
|---|---|---|---|
| `pagina` | number | ✅ sim | Página, 1-indexada |
| `registros_por_pagina` | number | ✅ sim | Tamanho da página — teto de 100 ✅ |
| `cConcluida` | string | ✅ não | `"S"`/`"N"` — o único filtro que existe |
| `apenas_importado_api` | string | ✅ não | Aceito; não mudou o total nesta conta |
| `ordenar_por` | string | ✅ não | Aceito; não altera o conjunto |

```json
{
  "call": "ListarOrdemProducao",
  "app_key": "SUA_APP_KEY",
  "app_secret": "SEU_APP_SECRET",
  "param": [{ "pagina": 1, "registros_por_pagina": 100, "cConcluida": "N" }]
}
```

O array de resposta chama-se `cadastros` ✅ — cada recurso da Omie escolhe um
nome diferente, ver [../convencoes/paginacao.md](../convencoes/paginacao.md).

**Todo filtro que você espera não existe**: produto, etapa, número da OP e data
são recusados com `Client-5001` ✅. Os nove nomes testados, o teto de página e o
comportamento de `cConcluida` estão em [leitura-filtros.md](leitura-filtros.md).

### O tamanho da conta

Medido em 10/08/2026 ✅:

| Recorte | `total_de_registros` | Páginas de 100 |
|---|---|---|
| Tudo | 1722 | 18 |
| `cConcluida: "S"` | 1659 | 17 |
| `cConcluida: "N"` | 63 | 1 |

As duas partes somam o total exatamente ✅. A leitura que interessa ao chão de
fábrica — o que está em produção agora — cabe em **uma requisição**. Varrer o
histórico inteiro custa 18, e quase tudo que vem é OP encerrada.

## `ConsultarOrdemProducao`

Param é a chave **direto na raiz**, sem wrapper 🔧
(`op-omie-gateway.ts:27-33`):

```json
{
  "call": "ConsultarOrdemProducao",
  "app_key": "SUA_APP_KEY",
  "app_secret": "SEU_APP_SECRET",
  "param": [{ "nCodOP": 9576999081 }]
}
```

`ChaveOP` aceita `nCodOP` **ou** `cCodIntOP` 🔧 (`op-gateway.ts:59-63`), mas
`cCodIntOP` veio `""` em toda a amostra ✅: na prática só `nCodOP` identifica uma
OP nesta conta. A escrita usa o wrapper `identificacao` e a leitura não — a
assimetria está em [escrita.md](escrita.md).

O que a consulta acrescenta à listagem ✅: `itens` (sempre `null`) e
`itensDetalhes[]`, os insumos daquela OP — ver
[campos-itens.md](campos-itens.md). Todo o resto já vem na listagem, inclusive o
bloco `observacoes`, que a interface trata como exclusivo da consulta 🔧.

## A listagem não sabe o nome do produto

`nCodProduto` vem cru ✅ — sem SKU, sem descrição. Uma tela de OPs precisa do
nome, e a Omie não o entrega junto.

E **não existe consulta de produtos em lote**: `ConsultarProduto` resolve um
código por chamada. Uma tela das 63 OPs abertas custa, ingenuamente:

| Passo | Requisições |
|---|---|
| Listar as OPs abertas | 1 |
| `ConsultarProduto`, um por produto distinto | até 63 |
| **Total** | **até 64** ≈ 19 s só de espaçamento |

O caminho barato é inverter: baixe o catálogo **uma vez** (2021 produtos, 41
requisições ✅ — ver [../produtos/leitura.md](../produtos/leitura.md)), indexe
por `codigo_produto` e sirva os nomes de lá. Passa a valer a partir de ~40
produtos distintos, e o índice serve estoque e estrutura ao mesmo tempo.

É o mesmo remédio do [../estoque/leitura.md](../estoque/leitura.md): varrer uma
vez e indexar, em vez de perguntar por item. A receita completa está em
[../90-receita-ops-abertas.md](../90-receita-ops-abertas.md).

## O laço

Páginas são 1-indexadas; `pagina: 0` é tratada como `1` ✅, sem erro. Pedir uma
página além do fim **devolve erro**, não lista vazia ✅:

```
SOAP-ENV:Client-5113
ERROR: Não existem registros para a página [9999]!
```

Pare por `total_de_paginas`, como em
[../convencoes/paginacao.md](../convencoes/paginacao.md) — e trate o
`Client-5113` como "acabou", não como falha.

## Próximo

- [leitura-filtros.md](leitura-filtros.md) — o único filtro, e os nove que não
  existem
- [campos.md](campos.md) — o que vem em cada bloco
- [campos-itens.md](campos-itens.md) — os insumos da OP
- [escrita.md](escrita.md) — `Incluir`/`Alterar`/`Excluir`
