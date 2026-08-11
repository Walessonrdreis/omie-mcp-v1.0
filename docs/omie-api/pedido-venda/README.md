# Pedido de venda — `produtos/pedido`

A demanda que motiva a produção: quem comprou o quê, quanto, e em que ponto do
funil de faturamento o pedido está. Esta doc cobre a **leitura**; o CRUD fica em
[`../../FERRAMENTAS.md`](../../FERRAMENTAS.md).

← [Índice](../README.md)

Dialeto **snake** no envelope e nos dados ✅ — é o recurso mais consistente da
doc nesse aspecto, ao contrário de [ordem de produção](../ordem-producao/README.md),
que mistura três estilos.

## Métodos

| Método | O que faz | Doc |
|---|---|---|
| `ListarPedidos` | Página de pedidos; **cinco filtros reais** | [leitura.md](leitura.md) |
| `ConsultarPedido` | Um pedido — e devolve **menos** que a listagem | [leitura.md](leitura.md) |
| `ListarEtapasFaturamento` | Catálogo de etapas, em **outro recurso** | [etapas.md](etapas.md) |
| `IncluirPedido` | Cria | [escrita.md](escrita.md) |
| `AlterarPedidoVenda` | Altera — nome fora do padrão | [escrita.md](escrita.md) |
| `ExcluirPedido` | Exclui | [escrita.md](escrita.md) |

Nenhum método de escrita foi executado contra a conta real — ver o aviso em
[escrita.md](escrita.md).

## Arquivos

| Arquivo | Assunto |
|---|---|
| [leitura.md](leitura.md) | Os dois métodos, o peso da resposta, `apenas_resumo` |
| [leitura-filtros.md](leitura-filtros.md) | Os cinco filtros, os oito recusados, o teto de 100 |
| [etapas.md](etapas.md) | O catálogo de `produtos/etapafat` — e o que ele revela sobre a OP |
| [campos.md](campos.md) | Os dez blocos da resposta |
| [escrita.md](escrita.md) | Fora de escopo: só o essencial, do código |
| [armadilhas.md](armadilhas.md) | As sete armadilhas do recurso |

## O essencial em sete linhas

1. **`etapa` É traduzível** ✅, ao contrário da OP: o catálogo vem de
   `ListarEtapasFaturamento`, no recurso `produtos/etapafat` — ver
   [etapas.md](etapas.md).
2. **Pedido cancelado mantém a etapa antiga** ✅. Em "Separar Estoque", **35 dos
   60** pedidos estão cancelados: filtrar por etapa sem cruzar com
   `infoCadastro.cancelado` infla a fila em 2,4×.
3. `ListarPedidos` aceita **cinco** filtros reais — etapa, cliente, vendedor,
   data e origem API ✅. É o recurso mais filtrável desta doc.
4. **A consulta devolve menos que a listagem** ✅: ela omite todo campo vazio ou
   zerado, e some com `codigo_empresa`. O inverso do que produtos faz.
5. A resposta tem **dez blocos e ~230 campos** ✅, contra quatro blocos na
   interface do repo. Uma página de 100 pedidos pesa ~165 KB.
6. `apenas_resumo: "S"` corta o payload em **7×** ✅ — descarta `det`,
   `total_pedido`, `lista_parcelas` e `departamentos`.
7. `AlterarPedidoVenda` **foge do padrão** dos irmãos
   (`IncluirPedido`/`ExcluirPedido`/`ConsultarPedido`) 🔧.

## O tamanho da conta

Medido em 10/08/2026 ✅:

| Recorte | `total_de_registros` |
|---|---|
| Tudo | 3607 |
| Etapa `"70"` (Entrega) | 2945 |
| Etapa `"60"` (Faturado) | 393 |
| Etapa `"20"` (Separar Estoque) | 60 |
| Criados via API (`apenas_importado_api: "S"`) | 1660 |

As sete etapas somam exatamente 3607 ✅ — a partição é limpa. A distribuição
completa está em [leitura-filtros.md](leitura-filtros.md).

## Relacionados

- [../ordem-producao/README.md](../ordem-producao/README.md) — a produção que
  atende esta demanda, e o outro sentido de "etapa"
- [../estoque/README.md](../estoque/README.md) — o saldo que a separação consome
- [../produtos/README.md](../produtos/README.md) — o catálogo por trás de
  `det[].produto`
- [../glossario/conceitos.md](../glossario/conceitos.md) — etapa de pedido ×
  etapa de OP
- [../convencoes/paginacao.md](../convencoes/paginacao.md) — o dialeto snake e o
  teto de 100
