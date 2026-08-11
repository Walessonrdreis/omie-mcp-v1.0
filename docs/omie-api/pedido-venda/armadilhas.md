# Pedido de venda — armadilhas

O que `produtos/pedido` faz diferente do que você espera. Formato fixo: o que
você espera → o que acontece → como contornar → evidência.

← [Pedido de venda](README.md) · [Índice](../README.md)

## 1. Pedido cancelado mantém a etapa antiga

**Você espera:** que cancelar um pedido o tire da fila em que ele estava.

**O que acontece:** o cancelamento **não reseta `etapa`** 🔧
(`pedido-venda-gateway.ts:101-105`). O pedido continua em "Separar Estoque" para
sempre, e a listagem por etapa o devolve como se estivesse ativo.

O tamanho do estrago nesta conta, medido em 10/08/2026 ✅:

| Etapa | Pedidos | Cancelados | Fila real |
|---|---|---|---|
| `"20"` Separar Estoque | 60 | **35** | 25 |
| `"50"` Faturar | 52 | 23 | 29 |
| `"10"` Orçamento e Proposta | 12 | 10 | 2 |

**58% da fila de separação é lixo.** Uma tela de chão de fábrica construída só
pela etapa manda separar 60 pedidos quando existem 25.

**Como contornar:** cruze sempre com `infoCadastro.cancelado === "S"`. E não
tente filtrar isso na origem: `cancelado` **não é aceito** como parâmetro de
`ListarPedidos` — é recusado com `Client-5001` ✅. Baixe a etapa inteira e filtre
em memória.

**Evidência:** `pedido-venda-gateway.ts:101-105` 🔧; contagem em
[leitura-filtros.md](leitura-filtros.md) ✅.

## 2. A consulta devolve menos que a listagem

**Você espera:** o padrão da Omie — `Consultar*` traz tudo que `Listar*` traz, e
mais. É o que
[../convencoes/tipos-formatos.md](../convencoes/tipos-formatos.md) descreve para
produtos, e o que a OP faz ao acrescentar `itensDetalhes`.

**O que acontece:** aqui é o inverso ✅. No mesmo pedido, 280 caminhos na
listagem contra 226 na consulta, e **nada** que só a consulta traga.

A regra: **a consulta omite todo campo vazio ou zerado**. Um único campo com
valor desaparece — `cabecalho.codigo_empresa` ✅.

**Como contornar:** trate campo ausente na consulta como `0`/`""`, não como
"não existe". E não escreva `pedido.total_pedido.valor_icms.toFixed(2)`: funciona
sobre a listagem e quebra sobre a consulta do mesmo pedido.

Se você já tem o pedido pela listagem, **a consulta não acrescenta nada** —
poupe a chamada.

**Evidência:** comparação campo a campo em 10/08/2026 ✅; tabela em
[leitura.md](leitura.md).

## 3. Etapa é traduzível, mas o código sozinho não identifica nada

**Você espera:** que `etapa: "20"` tenha um significado único.

**O que acontece:** o catálogo é indexado por **operação + código** ✅. `"20"` é
"Separar Estoque" na operação `"11"` (venda de produto), "Requisição" na `"21"`
(compra) e "LOJA" na `"28"` (ordem de produção).

E a tradução mora em **outro recurso**: `produtos/etapafat`, não
`produtos/pedido` 🔧 (`pedido-venda-omie-gateway.ts:44-49`). Resolver o nome de
uma etapa exige uma segunda chamada, a outro endpoint.

**Como contornar:** fixe a operação `"11"` 🔧
(`pedido-venda-gateway.ts:53-54`), baixe o catálogo **uma vez** e resolva em
memória. Uma chamada por linha da tela é o mesmo erro de N+1 do nome do produto
em [../ordem-producao/leitura.md](../ordem-producao/leitura.md).

Prefira `cDescricao` (o nome desta conta) e caia para `cDescrPadrao` só quando
ele vier vazio ✅ — nesta conta a etapa `"10"` é "Orçamento e Proposta", e o
padrão da Omie, "Pedido de Venda", não é o que o usuário reconhece.

**Evidência:** catálogo completo em [etapas.md](etapas.md) ✅.

## 4. `AlterarPedidoVenda` foge do padrão dos irmãos

**Você espera:** `Alterar` + o mesmo sufixo dos outros métodos do recurso.

**O que acontece:** os irmãos são `IncluirPedido`, `ExcluirPedido` e
`ConsultarPedido`; só a alteração é **`AlterarPedidoVenda`** 🔧
(`pedido-venda-omie-gateway.ts:108,116,124`).

**Como contornar:** não gere o nome do `call` concatenando verbo + entidade.
É a mesma lição do wrapper `identificacao` na OP: **a regra é por método, não
por recurso** — ver [../ordem-producao/armadilhas.md](../ordem-producao/armadilhas.md).

**Evidência:** `pedido-venda-omie-gateway.ts:105-127` 🔧.

## 5. O nome do filtro não é o nome do campo

**Você espera:** filtrar por `codigo_cliente`, já que é assim que o cliente vem
na resposta.

**O que acontece:** `codigo_cliente` é recusado com `Client-5001` ✅. O filtro
chama-se `filtrar_por_cliente`. Mesma história com o vendedor: `codVend` na
saída, `filtrar_por_vendedor` na entrada.

E o inverso também acontece: a etapa é `etapa` na entrada e na saída, mas
`filtrar_por_etapa` — o nome que o padrão sugeriria — é recusado ✅.

**Como contornar:** consulte a tabela de
[leitura-filtros.md](leitura-filtros.md) em vez de derivar o nome. Não há regra.

**Evidência:** oito tags testadas uma a uma em 10/08/2026 ✅.

## 6. `filtrar_por_data_ate` sozinho parte de hoje

**Você espera:** que enviar só `_ate` signifique "tudo até essa data".

**O que acontece:** sem `_de`, a Omie assume **hoje** como início ✅. Um
relatório de 2024 que envia só `filtrar_por_data_ate: "31/12/2024"` recebe
`Client-5113` — a janela vira "hoje até uma data no passado", que é vazia.

Pior: `Client-5113` é o mesmo código de "página sem registros", que todo cliente
bem escrito trata como **fim normal da paginação**. O relatório volta vazio, sem
erro, sem aviso.

**Como contornar:** envie sempre o par `_de` + `_ate`. E lembre que o recorte é
sobre **`data_previsao`**, não sobre a data de inclusão ✅ — verificado num
recorte onde os pedidos devolvidos tinham `dInc` fora da janela.

**Evidência:** cinco combinações testadas em 10/08/2026 ✅; tabelas em
[leitura-filtros.md](leitura-filtros.md).

## 7. Os campos de auditoria vêm ausentes, não vazios

**Você espera:** o comportamento da OP, onde `dConclusao` vem `""` quando não se
aplica.

**O que acontece:** aqui os trios `d`/`h`/`u` **somem da resposta** quando o
evento não ocorreu ✅. `infoCadastro` tem de 12 a 19 chaves conforme o estado:
`dCan`/`hCan`/`uCan` só em pedido cancelado, `dFat`/`hFat`/`uFat` só em
faturado.

**Como contornar:** `pedido.infoCadastro.dCan.split("/")` quebra em todo pedido
não cancelado. Teste a **presença da chave**, não o conteúdo — e derive o estado
de `cancelado`/`faturado`, que sempre vêm.

Dois recursos, duas convenções opostas para a mesma situação. Ver
[../convencoes/tipos-formatos.md](../convencoes/tipos-formatos.md).

**Evidência:** 60 pedidos da etapa `"20"` inspecionados em 10/08/2026 ✅;
tabelas em [campos.md](campos.md).

## Próximo

- [campos.md](campos.md) — o inventário dos dez blocos
- [etapas.md](etapas.md) — o catálogo, e o que ele revelou sobre a OP
- [leitura-filtros.md](leitura-filtros.md) — o que dá e o que não dá para filtrar
