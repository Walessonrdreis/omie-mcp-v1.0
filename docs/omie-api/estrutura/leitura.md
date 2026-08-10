# Estrutura — leitura

`ListarEstruturas` e `ConsultarEstrutura`, no recurso `geral/malha`.

← [Estrutura](README.md) · [Índice](../README.md)

Ambos usam o envelope padrão de
[../convencoes/request-auth.md](../convencoes/request-auth.md):
`POST https://app.omie.com.br/api/v1/geral/malha/`, com `call`, `app_key`,
`app_secret` e `param` (array de um objeto).

## O que o recurso economiza

A estrutura **já devolve descrição, unidade e família prontas de cada
componente** ✅ (`estrutura-gateway.ts:1-5`) 🔧. Quem monta tela de ficha técnica
não precisa cruzar com `geral/produtos` — diferente de `ListarOrdemProducao`,
que traz só código cru e obriga o enriquecimento.

## `ListarEstruturas`

Dialeto **húngaro** de paginação — ver
[../convencoes/paginacao.md](../convencoes/paginacao.md). É a armadilha nº 1 de
quem vem de `geral/produtos`: aqui **não existe** `pagina` nem
`registros_por_pagina`.

| Parâmetro | Tipo | Obrigatório | O que faz |
|---|---|---|---|
| `nPagina` | number | ✅ sim | Página, 1-indexada |
| `nRegPorPagina` | number | ✅ sim | Tamanho da página |

**Não há mais nenhum parâmetro.** O request é `malhaPesquisarRequest` e ele
rejeita qualquer tag desconhecida em vez de ignorá-la ✅:

```
SOAP-ENV:Client-5001
ERROR: Tag [IDPRODUTO] não faz parte da estrutura do tipo complexo
[malhaPesquisarRequest]!
```

Ou seja: **não existe filtro nativo** — nem por produto, nem por família, nem
por texto. Para uma estrutura específica, use `ConsultarEstrutura` (abaixo), não
uma varredura filtrada.

### Request

```json
{
  "call": "ListarEstruturas",
  "app_key": "SUA_APP_KEY",
  "app_secret": "SEU_APP_SECRET",
  "param": [{ "nPagina": 1, "nRegPorPagina": 50 }]
}
```

### Resposta e laço de paginação

| Campo do envelope | Significado |
|---|---|
| `nPagina` | Página devolvida |
| `nTotPaginas` | Total de páginas |
| `nRegistros` | Quantos vieram **nesta** página |
| `nTotRegistros` | Total de estruturas na conta |
| `produtosEncontrados` | Array de estruturas — campos em [campos.md](campos.md) |

```ts
let pagina = 1;
let totalDePaginas = 1;
do {
  const r = await gateway.listarEstruturasPagina(pagina, 50);
  processar(r.produtosEncontrados);
  totalDePaginas = r.nTotPaginas;
  pagina += 1;
} while (pagina <= totalDePaginas);
```

Pare por `nTotPaginas`, nunca por array vazio — o motivo está em
[../convencoes/paginacao.md](../convencoes/paginacao.md).

Nesta conta, `nTotRegistros` é **653** ✅, contra 2021 produtos no catálogo ✅.
A maioria dos produtos não tem estrutura, e a listagem **só devolve os que
têm** — ver [armadilhas.md](armadilhas.md). A 50 por página, varrer tudo custa
14 requisições.

## `ConsultarEstrutura`

Uma estrutura por chamada, **sem envelope de paginação** ✅. Devolve exatamente
o mesmo objeto que aparece dentro de `produtosEncontrados[]` — `ident`,
`itens[]`, `observacoes`, `custoProducao`.

| Parâmetro | Tipo | Obrigatório | O que faz |
|---|---|---|---|
| `idProduto` | number | ✅ não, se houver outra chave | ID interno da Omie |
| `codProduto` | string | ✅ não, se houver outra chave | SKU do usuário |
| `intProduto` | string | 📖 não, se houver outra chave | Chave de quem integra |

**Basta uma das três.** Confirmado ao vivo em 10/08/2026 para `idProduto` e
para `codProduto` isolado — `{ "codProduto": "100bm" }` devolveu a ficha
completa, incluindo o `idProduto` correspondente ✅. A terceira chave não foi
testada: `intProduto` não vem preenchido nesta conta ✅ (ver
[campos.md](campos.md)).

```json
{
  "call": "ConsultarEstrutura",
  "app_key": "SUA_APP_KEY",
  "app_secret": "SEU_APP_SECRET",
  "param": [{ "idProduto": 9116171984 }]
}
```

### Este método não está no gateway do repo

`IEstruturaGateway` (`estrutura-gateway.ts:105-122`) expõe só
`listarEstruturasPagina` para leitura 🔧. Quem precisa da ficha de **um**
produto hoje pagina a lista inteira e filtra em memória.

Uma chamada resolve o que hoje custa 14. Se você está escrevendo consumidor
novo, use `ConsultarEstrutura`; a varredura só se justifica quando você
realmente quer todas as estruturas.

### Produto sem estrutura devolve erro, não vazio

Consultar um produto que existe mas não tem malha cadastrada ✅:

```
SOAP-ENV:Client-103
ERROR: Produto não encontrado!
```

A mensagem mente — o produto existe. Trate `Client-103` neste recurso como
"produto sem estrutura", não como "produto inexistente"; detalhes em
[armadilhas.md](armadilhas.md) e
[../convencoes/erros.md](../convencoes/erros.md).

## Próximo

- [campos.md](campos.md) — o que cada campo significa
- [armadilhas.md](armadilhas.md) — o que morde
- [escrita.md](escrita.md) — `Incluir`/`Alterar`/`Excluir`
