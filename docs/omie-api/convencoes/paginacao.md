# Paginação

A Omie tem **dois dialetos de paginação incompatíveis**, e qual usar depende do
recurso. Não há como saber pelo nome do endpoint — só pela tabela abaixo.

← [Índice](../README.md)

## Os dois dialetos

| Dialeto | Parâmetros que você envia | Campos que voltam | Recursos |
|---|---|---|---|
| **snake** | `pagina`, `registros_por_pagina` | `pagina`, `total_de_paginas`, `registros`, `total_de_registros` | `geral/produtos` 🔧, `produtos/op` ✅, `produtos/pedido` 🔧 |
| **húngaro** | `nPagina`, `nRegPorPagina` | `nPagina`, `nTotPaginas`, `nRegistros`, `nTotRegistros` | `geral/malha` ✅, `estoque/consulta` ✅ |

Evidências: `produtos-omie-gateway.ts:31-41`, `estrutura-omie-gateway.ts:24-31`,
`estoque-omie-gateway.ts:29-39`, `op-omie-gateway.ts:16-25`,
`pedido-venda-omie-gateway.ts:33-34`.

**Atenção ao nome do tamanho de página no dialeto húngaro:** é `nRegPorPagina`,
abreviado. Não é `nRegistrosPorPagina` nem `registros_por_pagina` 🔧.

O que acontece se você errar o nome depende do recurso. Em `geral/malha`, a
Omie **recusa a chamada**, nomeando a tag e o tipo complexo do request ✅:

```
SOAP-ENV:Client-5001
ERROR: Tag [IDPRODUTO] não faz parte da estrutura do tipo complexo
[malhaPesquisarRequest]!
```

Isso é uma boa notícia — falha alto em vez de paginar errado em silêncio.
`estoque/consulta` se comporta igual ✅, nomeando o seu próprio tipo:

```
SOAP-ENV:Client-5001
ERROR: Tag [NCODPROD] não faz parte da estrutura do tipo complexo
[ListarEstPosRequest]!
```

`produtos/op` completa o terceiro, nomeando o seu tipo `copListarRequest` ✅ —
tanto para uma tag inventada quanto para nomes plausíveis de filtro como
`nCodProduto` ou `filtrar_por_data_de`.

Três recursos verificados, mesmo comportamento — mas **os demais continuam não
verificados**. Onde a rejeição não acontecer, o sintoma é um laço que não itera,
porque o campo de total vem `undefined` — e você conclui que a conta tem 50
produtos quando tem 2021. Ver [erros.md](erros.md).

Detalhe da mensagem: ela nomeia **uma tag por resposta**, mesmo quando várias
estão erradas ✅. Sondar um request desconhecido é um ciclo de tentativa e erro,
uma tag por vez.

## O nome do array de resultados também muda

Cada recurso devolve os registros num campo com nome próprio 🔧:

| Recurso | Campo do array |
|---|---|
| `geral/produtos` | `produto_servico_cadastro` |
| `geral/malha` | `produtosEncontrados` |
| `estoque/consulta` | `produtos` |
| `produtos/op` | `cadastros` |
| `produtos/pedido` | `pedido_venda_produto` |

Não há padrão. Um helper genérico de paginação precisa receber o nome do campo
como parâmetro.

## O laço correto

Peça a primeira página, leia o total de páginas da resposta, repita. Exemplo
real do repo, dialeto húngaro 🔧 (`estoque-omie-gateway.ts:41-54`):

```typescript
async listarTodasPosicoes(): Promise<PosicaoEstoque[]> {
  const posicoes: PosicaoEstoque[] = [];
  let pagina = 1;
  let totalPaginas = 1;

  do {
    const resposta = await this.listarPosEstoquePagina(pagina);
    totalPaginas = resposta.nTotPaginas;
    posicoes.push(...resposta.produtos);
    pagina++;
  } while (pagina <= totalPaginas);

  return posicoes;
}
```

Três detalhes que importam:

1. **Páginas são 1-indexadas** 🔧 — começar em `0` devolve erro ou a primeira página, dependendo do recurso.
2. **`totalPaginas` só é conhecido depois da primeira resposta** — por isso `do/while`, não `for`.
3. **Cada volta custa no mínimo 300ms** — ver [request-auth.md](request-auth.md).

## Página vazia pode vir como erro

Em alguns recursos, pedir uma página sem registros devolve **erro**, não lista
vazia 🔧. O código é `SOAP-ENV:Client-5113`, e ele precisa ser tratado como
"acabou", não como falha.

Isso já mordeu neste repo em Compras (ver `docs/API.md`, entrada de 2026-07-20),
e agora está confirmado ao vivo em `produtos/op` ✅:

```
SOAP-ENV:Client-5113
ERROR: Não existem registros para a página [9999]!
```

No mesmo recurso, `pagina: 0` **não** dá erro: é tratada como página 1 ✅. Ou
seja, o limite inferior é silencioso e o superior é ruidoso. Detalhes em
[erros.md](erros.md).

## Tamanho de página

Não há um limite único documentado, e **o que você pede não é necessariamente o
que você recebe**.

| Recurso | O repo pede 🔧 | A Omie entrega |
|---|---|---|
| `estoque/consulta` | 500 (`estoque-omie-gateway.ts:18`) | **100** ✅ |
| `produtos/op` | Definido por quem chama | **100** ✅ |
| Demais | Definido por quem chama | Não verificado |

**100 parece ser o teto da Omie, não do recurso** ✅: os dois verificados param
ali, apesar de usarem dialetos de paginação diferentes. Até que algum recurso
prove o contrário, planeje custo com 100 por página.

Em `estoque/consulta` o teto é silencioso: pedir 500 devolve 100 e recalcula
`nTotPaginas` como se você tivesse pedido 100 ✅. Sem erro, sem aviso — e o laço
por `nTotPaginas` continua correto, então nada quebra. O que quebra é a sua
estimativa de custo: a varredura completa da conta custa 14 requisições, não 3.

Página maior significa menos chamadas e menos espera de 300ms, mas **confira o
`nRegistros` da resposta** em vez de assumir o que você pediu. Um recurso pode
ter teto próprio, e `estoque/consulta` tem mais um caso: com `cExibeTodos: "S"`
ele ignora `nRegPorPagina` e fixa a página em 50 ✅ — ver
[../estoque/leitura-filtros.md](../estoque/leitura-filtros.md).

## Próximo

- [erros.md](erros.md) — inclusive o erro que significa "página vazia"
- [../glossario/campos.md](../glossario/campos.md) — o mesmo padrão de dois
  dialetos vale para os campos de dados, não só para a paginação
