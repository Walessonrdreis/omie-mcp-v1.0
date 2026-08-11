# Movimentos de estoque — `estoque/movestoque`

O que entrou e o que saiu de cada produto, dia a dia, por local. É o **histórico**
que [estoque/](../estoque/README.md) não guarda: lá está a posição de hoje, aqui
está como ela chegou nesse número.

← [Índice](../README.md)

## Método

| Método | Recurso | O que faz | Doc |
|---|---|---|---|
| `ListarMovimentos` | `estoque/movestoque` | Movimentos agregados por produto e por dia | [leitura.md](leitura.md) |

Só leitura. Não há método de escrita neste recurso — movimento se cria
indiretamente, por ajuste, OP, pedido ou nota 🔧.

## Arquivos

| Arquivo | Assunto |
|---|---|
| [leitura.md](leitura.md) | Os três parâmetros que existem, os doze que não existem, o custo |
| [campos.md](campos.md) | Os oito campos da resposta — e os que você esperaria e não vêm |
| [armadilhas.md](armadilhas.md) | As seis armadilhas do recurso |

## O essencial em sete linhas

1. O request é `epListarRequest` e aceita **três** parâmetros: `pagina`,
   `registros_por_pagina` e `codigo_local_estoque` ✅.
2. **Não existe filtro por produto** ✅ — seis nomes plausíveis foram recusados.
3. **Não existe filtro por período** ✅ — seis nomes de data foram recusados. A
   descrição da tool MCP promete os dois filtros; nenhum dos dois existe.
4. A paginação conta **produtos**, não movimentos ✅ — um "registro" é um produto
   com toda a sua história dentro.
5. Um movimento é o **resumo do dia**: uma linha por data, com entradas e saídas
   somadas ✅. Não é o lançamento individual.
6. Omitir `codigo_local_estoque` traz **só o local padrão** ✅ — mesmo viés de
   `ListarPosEstoque`, e aqui o filtro por local é o que permite ver os outros 14.
7. O movimento **não aponta o documento que o gerou** ✅. Não há elo com OP, com
   pedido nem com o ajuste.

## O que a descoberta não resolveu

O formato do request foi descoberto ao vivo em 10/08/2026 ✅ e os campos da
resposta estão completos. Duas perguntas ficam **em aberto**, e a doc não finge
cobri-las:

- **Existe filtro por produto ou por data com outro nome?** Doze nomes foram
  eliminados ✅ (a lista está em [leitura.md](leitura.md)). A ausência de
  resposta não é prova de que não exista uma décima terceira tag.
- **Como o movimento se relaciona com `id_movest`**, o ID que
  `IncluirAjusteEstoque` devolve ✅ — ver [../estoque/escrita.md](../estoque/escrita.md).
  Nada na resposta deste recurso carrega esse ID, então não há como casar os dois.

## Relacionados

- [../estoque/README.md](../estoque/README.md) — a posição de hoje, e o vizinho
  que compartilha o viés de local
- [../convencoes/paginacao.md](../convencoes/paginacao.md) — o dialeto snake e o
  teto de 100
- [../ordem-producao/README.md](../ordem-producao/README.md) — quem gera boa
  parte destes movimentos, sem que eles digam isso
