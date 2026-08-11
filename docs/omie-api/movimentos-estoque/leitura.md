# Movimentos de estoque — leitura

`ListarMovimentos`, no recurso `estoque/movestoque`. É o **único** método do
recurso.

← [Movimentos de estoque](README.md) · [Índice](../README.md)

Envelope padrão de
[../convencoes/request-auth.md](../convencoes/request-auth.md):
`POST https://app.omie.com.br/api/v1/estoque/movestoque/`, com `call`, `app_key`,
`app_secret` e `param` (array de um objeto).

Dialeto **snake** de paginação — `pagina` e `registros_por_pagina` ✅. É o
oposto do vizinho `estoque/consulta`, que pagina em húngaro: os dois sub-recursos
de estoque não se parecem nem nisso. Ver
[../convencoes/paginacao.md](../convencoes/paginacao.md).

## Parâmetros

Os três que `epListarRequest` aceita, os três verificados ao vivo ✅:

| Parâmetro | Tipo | Obrigatório | O que faz |
|---|---|---|---|
| `pagina` | number | ✅ sim | Página, 1-indexada |
| `registros_por_pagina` | number | ✅ sim | Produtos por página — teto silencioso de 100 |
| `codigo_local_estoque` | number | ✅ não | Local; omitido = **o local padrão**, não todos |

Não há mais nada. O tipo do request se chama `epListarRequest` e é o mesmo em
toda mensagem de erro ✅.

## O que o request recusa

A descrição da tool MCP diz que o método lista os movimentos "de um produto em um
período, por local de estoque" 🔧
(`src/modules/estoque/presentation/mcp/estoque-tools.ts:47-55`). Dos três
recortes prometidos, **só o local existe** ✅.

Doze nomes foram enviados e recusados com `SOAP-ENV:Client-5001`, em duas
sondagens (a de 10/08/2026 sobre `estoque/consulta` e a deste recurso) ✅:

| Conceito | Nomes recusados |
|---|---|
| Produto | `nCodProd`, `cCodIntProd`, `codigo_produto`, `nIdProduto`, `cCodProduto`, `cCodigo` |
| Período | `dDtEstoqueDe`, `dDtEstoqueAte`, `dDataDe`, `dDataAte`, `dDtInicial`, `dDtFinal` |
| Paginação húngara | `nPagina` |

```
SOAP-ENV:Client-5001
ERROR: Tag [NPAGINA] não faz parte da estrutura do tipo complexo
[epListarRequest]!
```

O detalhe cruel: `nCodProd`, `cCodIntProd` e `cCodigo` são exatamente os nomes
que a **resposta** usa para identificar o produto ✅. O recurso devolve os
campos e não aceita filtrar por eles.

**Isso não é prova de que os filtros não existam** — é o que doze tentativas
eliminaram. O `Client-5001` nomeia **uma tag por resposta**, mesmo com várias
erradas ✅, então cada chamada elimina exatamente um nome. Quem retomar a
sondagem começa daqui, não do zero.

## Request e laço

```json
{
  "call": "ListarMovimentos",
  "app_key": "SUA_APP_KEY",
  "app_secret": "SEU_APP_SECRET",
  "param": [{ "pagina": 1, "registros_por_pagina": 100 }]
}
```

```typescript
let pagina = 1;
let totalDePaginas = 1;
do {
  const r = await chamar("estoque/movestoque", "ListarMovimentos", { pagina, registros_por_pagina: 100 });
  processar(r.cadastros);          // um item por PRODUTO, não por movimento
  totalDePaginas = r.total_de_paginas;
  pagina += 1;
} while (pagina <= totalDePaginas);
```

Pare por `total_de_paginas`, nunca por array vazio — ver
[../convencoes/paginacao.md](../convencoes/paginacao.md).

## O que a varredura custa

Números desta conta, medidos em 10/08/2026 ✅:

| Grandeza | Valor |
|---|---|
| Produtos com movimento no local padrão | 1439 |
| Teto de página | 100 — pedir 500 devolve 100 ✅ |
| Páginas para varrer o local padrão | 15 |
| Espera mínima só de espaçamento | ~4,5 s (15 × 300ms) |
| Páginas para varrer os 15 locais | não medido — 3 só em `Insumos Fábrica` |

O teto se confirma do mesmo jeito silencioso do vizinho: pedir
`registros_por_pagina: 500` em um local com 210 produtos devolve
`total_de_paginas: 3` ✅, e a terceira página traz 10 registros. Confira o
`registros` da resposta, não o que você pediu.

**O custo por página é imprevisível**, e este recurso é o único da doc em que
isso acontece: uma página de 100 produtos pode trazer 100 linhas de movimento ou
mais de mil. Um insumo antigo desta conta traz **80 linhas sozinho** ✅. Dimensione
buffer e timeout pelo pior caso, não pela média.

## Local de estoque

Mesmo desenho de `ListarPosEstoque`, e o mesmo viés ✅:

| `codigo_local_estoque` | Local | Produtos com movimento |
|---|---|---|
| omitido | resolve para o local padrão | 1439 |
| `9169896468` | Estoque Labarr 711 — `padrao: "S"` | 1439 |
| `9176802789` | Insumos Fábrica | 210 |

Omitir o parâmetro e pedir o local padrão dão **o mesmo número** ✅: o default é
o depósito principal, não a empresa. Os outros 14 locais só aparecem se você
pedir cada um pelo ID.

A diferença em relação ao vizinho é que **aqui o filtro por local funciona como
saída**: para saber o que aconteceu em `Insumos Fábrica` — de onde a OP tira os
insumos, ver [../ordem-producao/campos-itens.md](../ordem-producao/campos-itens.md)
— basta pedir aquele local, sem varrer o resto. O catálogo de locais vem de
`ListarLocaisEstoque`, em `estoque/local`, que não é documentado aqui; ver
[../estoque/leitura.md](../estoque/leitura.md).

## Mais produtos aqui do que nas posições

No **mesmo local e no mesmo dia**, `ListarMovimentos` conta 1439 produtos e
`ListarPosEstoque` conta 1353 posições ✅ — 86 a mais deste lado.

A leitura provável é que produto com histórico e sem posição atual apareça só
aqui, mas **a interseção não foi conferida item a item**: os dois números vêm de
coletas separadas do dia 10/08/2026, e a diferença está registrada como
observação, não como explicação.

O que já dá para usar: se a sua varredura de posições não encontrou um produto,
**não conclua que ele nunca se moveu** — pergunte aqui antes. É o mesmo erro que
`cExibeTodos` resolve do outro lado, ver
[../estoque/leitura-filtros.md](../estoque/leitura-filtros.md).

## Próximo

- [campos.md](campos.md) — os oito campos, e por que só três descrevem o movimento
- [armadilhas.md](armadilhas.md) — o que morde
