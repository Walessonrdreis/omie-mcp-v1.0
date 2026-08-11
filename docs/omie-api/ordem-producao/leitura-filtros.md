# Ordem de produção — o único filtro, e os nove que não existem

`ListarOrdemProducao` aceita três parâmetros além da paginação, e só um deles
muda o conjunto de OPs devolvido.

← [Ordem de produção](README.md) · [leitura.md](leitura.md) · [Índice](../README.md)

Tudo nesta página foi testado ao vivo em 10/08/2026, uma tag por chamada ✅.

## `cConcluida` — o filtro que salva o recurso

Aceita `"S"` ou `"N"` e particiona a base exatamente ✅:

| `cConcluida` | `total_de_registros` | Páginas de 100 |
|---|---|---|
| omitido | 1722 | 18 |
| `"S"` | 1659 | 17 |
| `"N"` | **63** | **1** |

1659 + 63 = 1722. Sem sobreposição, sem resto.

Isso muda a natureza do recurso: **"o que está em produção agora" é uma
requisição**, não uma varredura de 18. Como 96% das OPs desta conta estão
encerradas, quem lista sem o filtro paga 18× para descartar quase tudo.

Valor inválido é recusado com a lista de opções na mensagem ✅:

```
SOAP-ENV:Client-105
ERROR: O preenchimento inválido da tag [cConcluida]!
Valores permitidos: 'S', 'N'.
```

Mesmo padrão dos enums de [../estoque/escrita.md](../estoque/escrita.md): o erro
serve de documentação, e custa uma chamada.

`cConcluida` é campo de `outrasInf` na resposta **e** parâmetro de entrada ✅ —
é o único campo da OP que atravessa os dois lados. E é o **único** indicador
confiável do estado: uma das OPs abertas observadas trazia `dConclusao`
preenchida ✅, ver [campos.md](campos.md).

## Os outros dois aceitos não filtram nada aqui

| Parâmetro | O que aconteceu |
|---|---|
| `apenas_importado_api` | Aceito com `"S"` e `"N"`; `total_de_registros` = 1722 nos dois ✅ |
| `ordenar_por` | Aceito com `"CODIGO"`; total inalterado ✅ |

`apenas_importado_api: "S"` deveria devolver só o que foi criado pela API. Nesta
conta o total não muda, e **as duas explicações são indistinguíveis**: ou todas
as 1722 OPs entraram pela API, ou o filtro não tem efeito. Não confie nele sem
testar na sua conta.

De `ordenar_por` só se sabe que o valor `"CODIGO"` é aceito ✅. Quais outros
valores existem, e se a ordem realmente muda, não foi verificado.

## Os nove que não existem

Cada um destes foi enviado sozinho e recusado com `Client-5001` ✅:

| Tag | Intenção |
|---|---|
| `nCodProduto`, `codigo_produto` | Filtrar pelo produto a produzir |
| `cEtapa`, `etapa`, `codigo_etapa` | Filtrar pela etapa do kanban |
| `nCodOP`, `cNumOP` | Buscar uma OP pelo número |
| `filtrar_por_data_de`, `dDtPrevisao` | Recortar por data |

```
SOAP-ENV:Client-5001
ERROR: Tag [NCODPRODUTO] não faz parte da estrutura do tipo complexo
[copListarRequest]!
```

O tipo do request é `copListarRequest`, e ele nomeia **uma tag por resposta**
mesmo quando várias estão erradas ✅ — sondar exige um ciclo por tag, como em
[../convencoes/paginacao.md](../convencoes/paginacao.md).

A ausência mais cara é a de **produto**: "quais OPs deste item?" só se responde
varrendo e filtrando em memória, exatamente como o saldo por produto em
[../estoque/leitura.md](../estoque/leitura.md). A diferença é que aqui
`cConcluida: "N"` reduz a varredura a uma página, se a pergunta for sobre
produção em aberto.

A segunda mais cara é a de **etapa**: montar um kanban exige baixar as 63 OPs
abertas e agrupar por `cEtapa` no cliente. Os nomes das colunas, ao menos, saem
de graça — uma chamada a `produtos/etapafat`, operação `"28"` ✅, ver
[../pedido-venda/etapas.md](../pedido-venda/etapas.md). O que não existe é o
recorte na origem. Ver [armadilhas.md](armadilhas.md).

## `registros_por_pagina` tem o mesmo teto de 100

Pedir mais que 100 não dá erro: devolve 100 e recalcula `total_de_paginas` ✅.

| Pedido | `registros` devolvido | `total_de_paginas` |
|---|---|---|
| 50 | 50 | 35 |
| 100 | 100 | 18 |
| 500 | 100 | 18 |

É o mesmo teto silencioso de `estoque/consulta` e de `produtos/pedido` ✅ — três
recursos, três dialetos de paginação, o mesmo limite. Trate 100 como o teto da
Omie até que algum recurso prove o contrário, e **confira o `registros` da
resposta** em vez de assumir o que pediu.

## Próximo

- [leitura.md](leitura.md) — os métodos, o laço e o custo do nome do produto
- [armadilhas.md](armadilhas.md) — o que morde
