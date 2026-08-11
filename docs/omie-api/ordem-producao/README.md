# Ordem de produção — `produtos/op`

O documento que diz "fabricar N unidades do produto X até a data D". É o último
elo da cadeia [produtos](../produtos/README.md) →
[estrutura](../estrutura/README.md) → ordem de produção: uma OP só existe para
produto que já tem ficha técnica ✅.

← [Índice](../README.md)

O recurso troca de dialeto no meio do caminho: pagina em **snake**
(`pagina`, `registros_por_pagina`) e devolve os dados em **húngaro**
(`nCodOP`, `cEtapa`) ✅.

## Métodos

| Método | O que faz | Doc |
|---|---|---|
| `ListarOrdemProducao` | Página de OPs; filtro só por `cConcluida` | [leitura.md](leitura.md) |
| `ConsultarOrdemProducao` | Uma OP com os insumos, chave na raiz | [leitura.md](leitura.md) |
| `IncluirOrdemProducao` | Cria — campos dentro de `identificacao` | [escrita.md](escrita.md) |
| `AlterarOrdemProducao` | Altera — mesmo wrapper | [escrita.md](escrita.md) |
| `ExcluirOrdemProducao` | Exclui — chave na raiz | [escrita.md](escrita.md) |

Nenhum método de escrita foi executado contra a conta real — ver o aviso em
[escrita.md](escrita.md).

## Arquivos

| Arquivo | Assunto |
|---|---|
| [leitura.md](leitura.md) | Métodos, paginação, o custo do nome do produto |
| [leitura-filtros.md](leitura-filtros.md) | `cConcluida`, as nove tags recusadas, o teto de 100 |
| [../pedido-venda/etapas.md](../pedido-venda/etapas.md) | O catálogo que traduz `cEtapa` — em outro recurso |
| [campos.md](campos.md) | Os quatro blocos da OP |
| [campos-itens.md](campos-itens.md) | Os insumos: quantidade já multiplicada, retrato do dia da criação |
| [escrita.md](escrita.md) | `Incluir`/`Alterar`/`Excluir`, derivados do código |
| [armadilhas.md](armadilhas.md) | As nove armadilhas do recurso |

## O essencial em seis linhas

1. **`cEtapa` vem como código cru** ✅ — `"10"`, `"20"`, `"60"`, `"80"` nesta
   conta. O catálogo que os traduz está em outro recurso, `produtos/etapafat`,
   operação `"28"` ✅ — ver [../pedido-venda/etapas.md](../pedido-venda/etapas.md).
2. `cConcluida` é o **único** filtro: 63 OPs abertas contra 1659 concluídas ✅ —
   uma requisição em vez de 18.
3. A listagem traz `nCodProduto` **sem descrição**, e produtos não têm consulta
   em lote ✅. Indexe o catálogo uma vez.
4. `Incluir`/`Alterar` usam o wrapper `identificacao`; `Consultar`/`Excluir`
   vão na raiz 🔧.
5. `itensDetalhes[].nQtde` **já vem multiplicada** pela quantidade da OP ✅ —
   ao contrário de `quantProdMalha` na estrutura.
6. Os insumos da OP são um **retrato do dia da criação**, não a ficha técnica de
   hoje ✅.

## Relacionados

- [../estrutura/README.md](../estrutura/README.md) — a ficha técnica que a OP
  copia, e o pré-requisito para criar uma
- [../estoque/README.md](../estoque/README.md) — o saldo que a OP consome e
  produz, sempre por local
- [../convencoes/paginacao.md](../convencoes/paginacao.md) — o dialeto snake e o
  teto de 100
- [../glossario/conceitos.md](../glossario/conceitos.md) — etapa de OP × etapa
  de pedido de venda
- [../pedido-venda/README.md](../pedido-venda/README.md) — a demanda que motiva
  a produção
