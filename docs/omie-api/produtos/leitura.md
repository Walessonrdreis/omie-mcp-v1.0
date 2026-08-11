# Produtos — leitura

`ListarProdutos` e `ConsultarProduto`, no recurso `geral/produtos`.

← [Produtos](README.md) · [Índice](../README.md)

Ambos usam o envelope padrão descrito em
[../convencoes/request-auth.md](../convencoes/request-auth.md):
`POST https://app.omie.com.br/api/v1/geral/produtos/`, com `call`, `app_key`,
`app_secret` e `param` (array de um objeto).

## `ListarProdutos`

Dialeto **snake** de paginação — ver
[../convencoes/paginacao.md](../convencoes/paginacao.md).

| Parâmetro | Tipo | Obrigatório | O que faz |
|---|---|---|---|
| `pagina` | number | ✅ sim | Página, 1-indexada |
| `registros_por_pagina` | number | ✅ sim | Tamanho da página |
| `apenas_importado_api` | string | ✅ **não** | `"N"` amplia o resultado — ver abaixo |
| `filtrar_apenas_omiepdv` | string | ✅ **não** | `"N"` amplia o resultado — ver abaixo |
| `filtrar_apenas_familia` | number | ✅ não | Filtra por família; omitir traz todas 🔧 |

### Os dois flags não são obrigatórios, mas mudam o resultado

O gateway envia `apenas_importado_api: "N"` e `filtrar_apenas_omiepdv: "N"`
incondicionalmente (`produtos-omie-gateway.ts:34-40`) 🔧. A coleta de
10/08/2026 mostrou que **omiti-los não causa erro** — a chamada responde 200
normalmente ✅. Mas o resultado é outro:

| Requisição (`registros_por_pagina: 1`) | `total_de_registros` |
|---|---|
| Com os dois flags `"N"` | 2021 ✅ |
| Sem nenhum dos dois | 593 ✅ |

Não é só a contagem. O **mesmo produto** (`codigo_produto: 9116171984`) volta
com conteúdo fiscal diferente conforme os flags ✅:

| Campo | Com os flags | Sem os flags |
|---|---|---|
| `cfop` | `""` | `"5.101"` |
| `csosn_icms` | `""` | `"102"` |
| `cst_pis` / `cst_cofins` | `""` | `"99"` |
| `class_trib` | `""` | `"000001"` |
| `aliquota_cbs` | `0` | `0.9` |
| `aliquota_ibs_uf` | `0` | `0.1` |
| `origem_imposto` | ausente | `"NCM"` |
| `dadosIbpt` | ausente | presente |

**Consequência prática:** os flags não são um detalhe defensivo. Enviá-los
`"N"` traz o cadastro completo com o fiscal *como está no produto*; omiti-los
traz um subconjunto com o fiscal *resolvido*. Para inventário e chão de
fábrica, envie os dois `"N"`, como o gateway faz. Para leitura fiscal, saiba
que a resposta com os flags **não** é fonte confiável de CFOP/CST.

Isto corrige a afirmação anterior de que os parâmetros eram "exigidos".

### Request mínimo

```json
{
  "call": "ListarProdutos",
  "app_key": "SUA_APP_KEY",
  "app_secret": "SEU_APP_SECRET",
  "param": [{ "pagina": 1, "registros_por_pagina": 50 }]
}
```

### Request como o repo faz

```json
{
  "call": "ListarProdutos",
  "app_key": "SUA_APP_KEY",
  "app_secret": "SEU_APP_SECRET",
  "param": [{
    "pagina": 1,
    "registros_por_pagina": 50,
    "apenas_importado_api": "N",
    "filtrar_apenas_omiepdv": "N",
    "filtrar_apenas_familia": 9182781678
  }]
}
```

### Resposta e laço de paginação

O envelope traz `pagina`, `total_de_paginas`, `registros`,
`total_de_registros`, e os itens em `produto_servico_cadastro[]` ✅. Os campos
de cada item estão em [campos.md](campos.md).

```ts
let pagina = 1;
let totalDePaginas = 1;
do {
  const r = await gateway.listarProdutosPagina(pagina, 50);
  processar(r.produto_servico_cadastro);
  totalDePaginas = r.total_de_paginas;
  pagina += 1;
} while (pagina <= totalDePaginas);
```

Pare por `total_de_paginas`, nunca por array vazio — o motivo está em
[../convencoes/paginacao.md](../convencoes/paginacao.md).

Com 2021 produtos e 50 por página, o catálogo inteiro custa 41 requisições ✅.
A 300ms mínimos entre chamadas isso é ~12s de parede.

## `ConsultarProduto`

Um produto por chamada. O gateway envia só `codigo_produto`
(`produtos-omie-gateway.ts:46-47`) 🔧.

| Parâmetro | Tipo | Obrigatório | O que faz |
|---|---|---|---|
| `codigo_produto` | number | ✅ não, se houver outra chave | ID interno da Omie |
| `codigo` | string | ✅ não, se houver outra chave | SKU do usuário |
| `codigo_produto_integracao` | string | 📖 não, se houver outra chave | Chave de quem integra |

**Basta uma das três** — é o que `ChaveProduto`
(`produtos-gateway.ts:43-48`) já assumia 🔧. Confirmado ao vivo em 10/08/2026
para `codigo_produto` e para `codigo` isolado: `{ "codigo": "100kg" }`
devolveu o cadastro completo, incluindo o `codigo_produto` correspondente ✅.
A terceira chave (`codigo_produto_integracao`) não foi testada — nesta conta
todos os registros trazem `""` nesse campo ✅.

```json
{
  "call": "ConsultarProduto",
  "app_key": "SUA_APP_KEY",
  "app_secret": "SEU_APP_SECRET",
  "param": [{ "codigo_produto": 9116171984 }]
}
```

A consulta devolve um objeto de produto direto, **sem envelope de paginação** ✅.
Ela é um superconjunto da listagem — os campos exclusivos estão em
[campos.md](campos.md).

### Não existe consulta em lote

Para enriquecer N produtos, o repo faz N chamadas com deduplicação e
concorrência 5 (`consultarProdutosPorCodigo`, `produtos-gateway.ts:70-75`) 🔧.
Não há endpoint que aceite uma lista de códigos.

Quando você já vai percorrer boa parte do catálogo, **listar e indexar em
memória sai mais barato que consultar produto a produto** — 41 chamadas contra
2021. As receitas de cruzamento estão em
[../90-modelo-frontend.md](../90-modelo-frontend.md).

## Próximo

- [campos.md](campos.md) — o que cada campo significa
- [armadilhas.md](armadilhas.md) — o que morde
- [escrita.md](escrita.md) — `Incluir`/`Alterar`/`Excluir`
