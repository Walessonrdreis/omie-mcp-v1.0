# Pedido de venda — os cinco filtros, e os oito que não existem

`ListarPedidos` é o recurso **mais filtrável** desta doc. Depois de
[ordem de produção](../ordem-producao/leitura-filtros.md), onde só `cConcluida`
existe, a diferença surpreende.

← [Pedido de venda](README.md) · [leitura.md](leitura.md) · [Índice](../README.md)

Tudo nesta página foi testado ao vivo em 10/08/2026, uma tag por chamada ✅.

## `etapa` — particiona a base exatamente

Aceita o código de etapa do catálogo da operação `"11"` ✅ (ver
[etapas.md](etapas.md)):

| `etapa` | Nome nesta conta | `total_de_registros` | Cancelados |
|---|---|---|---|
| `"00"` | Proposta *(inativa)* | 145 | 78 dos 100 amostrados |
| `"10"` | Orçamento e Proposta | 12 | 10 |
| `"20"` | Separar Estoque | 60 | **35** |
| `"50"` | Faturar | 52 | 23 |
| `"60"` | Faturado | 393 | Não contado |
| `"70"` | Entrega | 2945 | Não contado |
| `"80"` | *(disponível, inativa)* | 0 | — |

145 + 12 + 60 + 52 + 393 + 2945 = **3607**, o total exato ✅. Sem sobreposição,
sem resto — todo pedido tem exatamente uma etapa.

Duas leituras que a tabela esconde:

1. **A coluna "Cancelados" é a armadilha central do recurso.** Em "Separar
   Estoque", 35 dos 60 pedidos estão cancelados ✅: uma fila de separação
   construída só pela etapa mostra 60 itens quando o chão de fábrica tem 25.
   Ver [armadilhas.md](armadilhas.md).
2. **Etapa inativa não fica vazia.** A etapa `"00"` tem `cInativo: "S"` no
   catálogo e ainda assim **145 pedidos** parados nela ✅. "Inativa" significa
   "não oferecida para novos pedidos", não "sem registros".

Código de etapa inexistente não dá `Client-105` com a lista de opções, como
`cConcluida` faz na OP. Devolve `Client-5113` ✅ — indistinguível de uma etapa
válida e vazia:

```
SOAP-ENV:Client-5113
ERROR: Não existem registros para a página [1]!
```

Valide o código contra o catálogo antes de enviar; a API não vai reclamar.

## `filtrar_por_cliente` e `filtrar_por_vendedor`

Filtram de verdade ✅:

| Parâmetro | Valor testado | `total_de_registros` |
|---|---|---|
| `filtrar_por_cliente` | `9162565190` | 3 |
| `filtrar_por_vendedor` | `9162623954` | 16 |

**O nome não é o do campo na resposta.** O cliente vem como `codigo_cliente` no
`cabecalho`, mas o filtro é `filtrar_por_cliente` — e mandar `codigo_cliente`
como parâmetro é recusado com `Client-5001` ✅. Mesma história para o vendedor
(`codVend` na resposta, `filtrar_por_vendedor` na entrada).

## `filtrar_por_data_de` / `filtrar_por_data_ate`

Recortam por **`data_previsao`**, não por data de inclusão ✅. Verificado num
recorte de 01/08 a 05/08/2026: os pedidos devolvidos têm `data_previsao` dentro
da janela e `dInc: "20/07/2026"`, fora dela.

| Recorte | `total_de_registros` |
|---|---|
| `de: 01/01/2024`, `ate: 31/12/2024` | 761 |
| `de: 01/01/2026` | 1521 |
| `de: 01/08/2026`, `ate: 10/08/2026` | 70 |

**`filtrar_por_data_ate` sozinho não significa "tudo até essa data".** Sem
`_de`, a Omie assume **hoje** como início ✅ — três chamadas provam:

| Param | Resultado |
|---|---|
| `ate: 31/12/2026` | 33 |
| `de: 10/08/2026` *(hoje)* | 33 |
| `de: 10/08/2026`, `ate: 31/12/2026` | 33 |

Pedir só `ate: 31/12/2024` devolve `Client-5113` — a janela vira
"hoje até uma data no passado", que é vazia. Um relatório de histórico que envia
só `_ate` volta vazio sem erro visível. **Envie sempre o par.**

Ano anterior a 1900 é recusado com um código próprio ✅:

```
SOAP-ENV:Client-104
ERROR: O ano informado na tag [filtrar_por_data_de] deve ser maior que 1900!
```

## `apenas_importado_api` — aqui filtra, na OP não

`"S"` devolve **1660 dos 3607** pedidos ✅: 46% desta conta entrou pela API.

Vale contrastar com [ordem de produção](../ordem-producao/leitura-filtros.md),
onde o mesmo parâmetro é aceito e **não muda nada**. O nome é o mesmo, o
comportamento não — teste por recurso.

Confirmação cruzada na resposta: pedidos criados por API trazem
`infoCadastro.uInc: "WEBSERVICE"` em vez de um código de usuário ✅, e
`cabecalho.origem_pedido` distingue a procedência: `"ERP"`, `"WIX"`, `"AMZ"` e
`"MRC"` nesta conta ✅.

## Os oito que não existem

Cada um foi enviado sozinho e recusado com `Client-5001` ✅:

| Tag | Intenção |
|---|---|
| `codigo_cliente` | Filtrar pelo cliente — use `filtrar_por_cliente` |
| `codigo_pedido`, `numero_pedido` | Buscar um pedido — use `ConsultarPedido` |
| `data_previsao` | Recortar por data — use `filtrar_por_data_de`/`_ate` |
| `cancelado`, `faturado`, `filtrar_apenas_faturado` | Filtrar por estado |
| `filtrar_por_etapa` | Filtrar por etapa — o nome certo é `etapa`, sem prefixo |

```
SOAP-ENV:Client-5001
ERROR: Tag [CANCELADO] não faz parte da estrutura do tipo complexo
[pvpListarRequest]!
```

O tipo do request é `pvpListarRequest` — e `pvpConsultarRequest` no
`ConsultarPedido` ✅. É o **quarto recurso** desta doc a rejeitar tag
desconhecida em vez de ignorá-la, ver
[../convencoes/paginacao.md](../convencoes/paginacao.md).

A ausência que mais custa é a de **`cancelado`**: o estado que você precisa
cruzar com a etapa é justamente o que não dá para filtrar na origem. Baixe e
filtre em memória — ver [armadilhas.md](armadilhas.md).

Três nomes são aceitos e **não mudam nada** nesta conta ✅:
`filtrar_por_hora_de`, `filtrar_apenas_alteracao` e `filtrar_por_projeto`
(testado com `0`, o único projeto desta conta). `ordenar_por` e
`ordem_descrescente` também são aceitos — repare na grafia: a Omie escreve
`ordem_descrescente`, e `ordem_decrescente` é recusado com `Client-5001` ✅.

## `registros_por_pagina` tem o mesmo teto de 100

Pedir mais que 100 não dá erro: devolve 100 e recalcula `total_de_paginas` ✅.

| Pedido | `registros` devolvido | `total_de_paginas` |
|---|---|---|
| 50 | 50 | 73 |
| 100 | 100 | 37 |
| 200 | 100 | 37 |
| 500 | 100 | 37 |

**Terceiro recurso a parar em 100** ✅, agora com um dialeto snake completo,
depois de `estoque/consulta` (húngaro) e `produtos/op` (misto). Ver
[../convencoes/paginacao.md](../convencoes/paginacao.md).

## Próximo

- [etapas.md](etapas.md) — o catálogo que dá nome a esses códigos
- [campos.md](campos.md) — o que vem em cada bloco
- [armadilhas.md](armadilhas.md) — o que morde
