# Estoque — leitura

`ListarPosEstoque`, no recurso `estoque/consulta`. É o **único** método de
leitura de posição de estoque da Omie.

← [Estoque](README.md) · [Índice](../README.md)

Envelope padrão de
[../convencoes/request-auth.md](../convencoes/request-auth.md):
`POST https://app.omie.com.br/api/v1/estoque/consulta/`, com `call`, `app_key`,
`app_secret` e `param` (array de um objeto).

Dialeto **húngaro** de paginação — ver
[../convencoes/paginacao.md](../convencoes/paginacao.md). O nome do tamanho de
página é `nRegPorPagina`, abreviado: nem `nRegistrosPorPagina`, nem
`registros_por_pagina`.

## Não existe filtro por produto

Este é o fato central do recurso, e ele molda tudo que vem depois: **não há como
pedir a posição de um produto específico** ✅.

Os três nomes plausíveis foram testados ao vivo e os três são recusados:

| Tag enviada | Resultado |
|---|---|
| `nCodProd` | `Client-5001` — tag não faz parte de `ListarEstPosRequest` ✅ |
| `idProduto` | `Client-5001` — mesma recusa ✅ |
| `cCodigo` | `Client-5001` — mesma recusa ✅ |

```
SOAP-ENV:Client-5001
ERROR: Tag [NCODPROD] não faz parte da estrutura do tipo complexo
[ListarEstPosRequest]!
```

Para o estoque de **um** produto, o único caminho é varrer todas as páginas e
filtrar em memória — é literalmente o que o repo faz 🔧
(`estoque-omie-gateway.ts:56-59`):

```typescript
async listarPosicoesPorProduto(codigoProduto: number): Promise<PosicaoEstoque[]> {
  const todas = await this.listarTodasPosicoes();
  return todas.filter((p) => p.nCodProd === codigoProduto);
}
```

### O que essa varredura custa

Números desta conta, medidos em 10/08/2026 ✅:

| Grandeza | Valor |
|---|---|
| Posições no local padrão | 1353 |
| Tamanho de página que o repo pede | 500 (`estoque-omie-gateway.ts:18`) 🔧 |
| Tamanho de página que a Omie entrega | 100 — ver [leitura-filtros.md](leitura-filtros.md) |
| Páginas para varrer tudo | 14 |
| Espera mínima só de espaçamento | ~4,2 s (14 × 300ms) |

Ou seja: **cada consulta de saldo de um único produto baixa 1353 posições e
descarta 1352.** Uma tela que mostra o saldo de 10 produtos, resolvida
ingenuamente produto a produto, faz 140 requisições e leva mais de 40 segundos.

E essa varredura **não cobre a conta inteira**: são as posições do local padrão.
Somar o saldo real de um produto exige repetir tudo por local — ver a seção
[Local de estoque](#local-de-estoque).

A saída é inverter o custo: varra **uma vez**, indexe por `nCodProd` em memória
ou em cache, e sirva as consultas dali. É exatamente o tipo de caso em que a
camada própria vale mais que a Omie direta — ver
[../91-gaps-camada-propria.md](../91-gaps-camada-propria.md).

## Parâmetros

Os cinco que `ListarEstPosRequest` aceita, todos verificados ao vivo ✅:

| Parâmetro | Tipo | Obrigatório | O que faz |
|---|---|---|---|
| `nPagina` | number | ✅ sim | Página, 1-indexada |
| `nRegPorPagina` | number | ✅ sim | Tamanho da página — teto silencioso de 100 |
| `codigo_local_estoque` | number | ✅ não | Local; `0` ou omitido = **o local padrão**, não todos |
| `dDataPosicao` | string | ✅ não | Posição retroativa, `dd/mm/aaaa` |
| `cExibeTodos` | string | ✅ não | `"S"` inclui produto sem movimento **no local pedido** |

Note a mistura de estilos: a paginação é húngara, mas `codigo_local_estoque` é
snake ✅ — os dois convivem no mesmo request, como o bloco `caracteristicas` de
produtos faz na resposta (ver
[../glossario/campos.md](../glossario/campos.md)).

### Os três que mudam o resultado

`nRegPorPagina`, `cExibeTodos` e `dDataPosicao` fazem mais do que o nome sugere,
e nenhum dos três comportamentos está na doc oficial. Em resumo ✅:

| Parâmetro | A surpresa |
|---|---|
| `nRegPorPagina` | Teto silencioso de 100 — pedir 500 devolve 100, sem erro |
| `cExibeTodos` | `"S"` muda o universo (1353 → 2021) **e** fixa a página em 50 |
| `dDataPosicao` | Reconstrói a posição em qualquer data passada |

Os números, as tabelas comparativas e o custo de cada combinação estão em
[leitura-filtros.md](leitura-filtros.md).

## Request e laço

```json
{
  "call": "ListarPosEstoque",
  "app_key": "SUA_APP_KEY",
  "app_secret": "SEU_APP_SECRET",
  "param": [{ "nPagina": 1, "nRegPorPagina": 100, "codigo_local_estoque": 0 }]
}
```

```typescript
let pagina = 1;
let totalDePaginas = 1;
do {
  const r = await gateway.listarPosEstoquePagina(pagina);
  processar(r.produtos);
  totalDePaginas = r.nTotPaginas;
  pagina += 1;
} while (pagina <= totalDePaginas);
```

Pare por `nTotPaginas`, nunca por array vazio — o motivo está em
[../convencoes/paginacao.md](../convencoes/paginacao.md).

## Local de estoque

`codigo_local_estoque: 0` e omitir o parâmetro dão **o mesmo resultado**: 1353
posições ✅. Um código inexistente é recusado ✅:

```
SOAP-ENV:Client-1070
ERROR: Local do Estoque não cadastrado para o Código [12345] ! -
tag: [codigo_local_estoque]
```

Ou seja, `0` é tratado como valor especial, não como um local real. E ele
significa **o local padrão, não todos os locais** ✅ — a conta tem 15 locais
cadastrados, e cada um responde com a sua própria posição:

| `codigo_local_estoque` | Local | Posições |
|---|---|---|
| `0` (ou omitido) | resolve para `9169896468` | 1353 |
| `9169896468` | Estoque Labarr 711 — `padrao: "S"` | 1353 |
| `9084171539` | Estoque Fábrica | 284 |
| `9176802789` | Insumos Fábrica | 51 |

**A leitura padrão não enxerga o saldo dos outros locais.** Um insumo que só
existe em `Insumos Fábrica` some da varredura sem deixar rastro — não vem
zerado, simplesmente não aparece.

O catálogo de locais vem de `ListarLocaisEstoque`, no recurso `estoque/local` —
paginação húngara, array `locaisEncontrados`, 15 registros nesta conta ✅. Cada
local traz `padrao`, `inativo` e as flags `dispVenda`, `dispRemessa` e
`dispOrdemProducao`. Esse recurso **não é documentado aqui**: o escopo desta
pasta é `estoque/consulta` e `estoque/ajuste`. Ver
[../glossario/conceitos.md](../glossario/conceitos.md).

O que a resposta devolve nunca é `0`: é sempre o ID real do local ✅ — você manda
`0` e recebe `9169896468`.

## Recurso vizinho: `estoque/movestoque`

`ListarMovimentos` lista movimentações, não posições, e agora tem doc própria:
[../movimentos-estoque/README.md](../movimentos-estoque/README.md).

Três coisas dali mudam o que você faz aqui ✅:

- Ele **também não filtra por produto** — a armadilha 1 não tem escapatória pelo
  vizinho, e ainda ganhou seis nomes recusados novos.
- Ele pagina em **snake** (`pagina`, `registros_por_pagina`), não em húngaro. Os
  dois sub-recursos de estoque não compartilham nem o dialeto de paginação.
- Ele tem o **mesmo viés de local**: omitir `codigo_local_estoque` traz só o
  padrão. Mas é a forma mais barata de ver o que se moveu nos outros 14 locais.

## Próximo

- [leitura-filtros.md](leitura-filtros.md) — os três parâmetros que mudam o
  resultado, com os números
- [campos.md](campos.md) — o que cada campo significa
- [armadilhas.md](armadilhas.md) — o que morde
- [escrita.md](escrita.md) — o ajuste de estoque
