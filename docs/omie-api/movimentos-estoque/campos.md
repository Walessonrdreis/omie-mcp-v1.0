# Movimentos de estoque — campos da resposta

Envelope de `ListarMovimentos` e os dois níveis aninhados: `cadastros[]`, que
fala de **produto**, e `movimentos[]`, que fala de **dia**.

← [Movimentos de estoque](README.md) · [Índice](../README.md)

A coluna "Sempre vem?" foi verificada em 10/08/2026 contra a conta real, em
quatro respostas com combinações diferentes de página, tamanho e local — 15
produtos e mais de 110 linhas de movimento ✅.

## Envelope

| Campo | Tipo | Sempre vem? | Significado |
|---|---|---|---|
| `pagina` | number | ✅ sim | Página devolvida |
| `total_de_paginas` | number | ✅ sim | Total de páginas — contadas em **produtos** |
| `registros` | number | ✅ sim | Quantos **produtos** vieram nesta página |
| `total_de_registros` | number | ✅ sim | Total de **produtos** no recorte pedido |
| `cadastros` | array | ✅ sim | Um item por produto — tabela abaixo |

Nenhum dos quatro conta movimentos. `total_de_registros: 1439` são 1439 produtos,
cada um com uma história de tamanho arbitrário dentro ✅. Ver
[armadilhas.md](armadilhas.md).

## `cadastros[]` — um item por produto

| Campo | Tipo | Sempre vem? | Significado | Sinônimo |
|---|---|---|---|---|
| `nCodProd` | number | ✅ sim | ID interno do produto | `codigo_produto` (produtos) |
| `cCodigo` | string | ✅ sim | SKU do produto | `codigo` (produtos) |
| `cDescricao` | string | ✅ sim | Descrição do produto | `descricao` (produtos) |
| `cCodIntProd` | string | ✅ sim, sempre `""` | Código de integração do produto | `cCodInt` (estoque/consulta) |
| `movimentos` | array | ✅ sim | As linhas de movimento — tabela abaixo | — |

Os quatro primeiros são idênticos aos de `estoque/consulta`, com um único
desvio de nome: o código de integração é `cCodIntProd` aqui e `cCodInt` lá ✅.

`cCodIntProd` veio `""` em **todos** os 15 produtos observados ✅ — nesta conta o
campo não é usado.

## `movimentos[]` — uma linha por dia

| Campo | Tipo | Sempre vem? | Significado | Sinônimo |
|---|---|---|---|---|
| `dDataMovimento` | string | ✅ sim | Data do dia agregado, `dd/mm/aaaa` | `dDataPosicao` (estoque/consulta) |
| `nQtdeEntradas` | number | ✅ sim | Tudo que entrou naquele dia, somado | — |
| `nQtdeSaidas` | number | ✅ sim | Tudo que saiu naquele dia, somado | — |

**Três campos, e nenhum a mais** ✅. Não há ID do movimento, local, documento de
origem, tipo, motivo, custo, valor ou saldo acumulado — a seção final lista o que
falta e o que isso impede.

## Uma linha é o resumo do dia, não um lançamento

O nome `movimentos` sugere lançamento a lançamento. É agregação diária, e a prova
está nas linhas em que os **dois** números são diferentes de zero ✅:

| Produto | Data | `nQtdeEntradas` | `nQtdeSaidas` |
|---|---|---|---|
| `pcscp` — pistache | 12/11/2024 | 10 | 0,55692 |
| `PRD00106` — 70% tâmaras | 01/09/2025 | 13,206 | 13,206 |
| `000063140001` — tampa | 19/12/2024 | 75 | 9 |

Uma entrada de 10 e uma saída de 0,55692 não são o mesmo evento. São o total do
dia, em dois baldes.

Consequências para quem consome:

- **Não dá para contar movimentos.** O número de linhas é o número de dias com
  atividade, não de lançamentos.
- **A direção não é um campo.** Some, subtraia ou compare os dois números; não
  existe `tipo: "ENT"` como no ajuste, ver [../estoque/escrita.md](../estoque/escrita.md).
- **Entradas iguais a saídas no mesmo dia é o padrão dos intermediários** ✅ —
  produto que a fábrica gera e consome no mesmo dia aparece assim em quase toda
  a amostra de `Insumos Fábrica`.

As quantidades são fracionárias e chegam a seis casas (`0.225956`) ✅, como em
todo o resto da API — ver
[../convencoes/tipos-formatos.md](../convencoes/tipos-formatos.md). Nenhuma veio
negativa na amostra: o sinal está no balde, não no número.

## O que não vem — e o que isso impede

| Ausente | O que deixa de ser possível |
|---|---|
| Documento de origem (OP, pedido, nota, ajuste) | Ligar o consumo a uma ordem de produção específica |
| ID do movimento (`id_movest`) | Casar com o retorno de `IncluirAjusteEstoque` 🔧 |
| Local por linha | Saber de onde saiu, dentro de uma resposta multi-local — o local só existe como filtro de entrada |
| Custo ou valor | Valorizar a movimentação do período |
| Saldo acumulado | Reconstruir a posição sem somar tudo desde o começo |

A primeira linha é a que mais custa: **este recurso não é o elo entre estoque e
produção** ✅. A pergunta "quais OPs consumiram este insumo?" continua sem
resposta pela API — só `ConsultarOrdemProducao` sabe o que cada OP levou, ver
[../ordem-producao/campos-itens.md](../ordem-producao/campos-itens.md), e o
caminho é da OP para o insumo, nunca o contrário.

## Próximo

- [leitura.md](leitura.md) — como pedir esses campos, e o que a varredura custa
- [armadilhas.md](armadilhas.md) — o que morde
