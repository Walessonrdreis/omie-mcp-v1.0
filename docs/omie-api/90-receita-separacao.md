# Receita 3 — pedidos pendentes de separação

**A pergunta:** o que separar hoje, para quem, e quanto de cada produto?

← [Modelo para o frontend](90-modelo-frontend.md) · [Índice](README.md)

É a receita mais barata das três — duas requisições — e a que mais erra quando
montada só pela etapa.

## A armadilha que define a receita

**Pedido cancelado mantém a etapa antiga** ✅. O cancelamento não reseta
`cabecalho.etapa`, então o pedido continua em "Separar Estoque" para sempre.

| Etapa `"20"` — Separar Estoque | Pedidos ✅ |
|---|---|
| Devolvidos pela listagem | 60 |
| Cancelados | 35 |
| **Fila real** | **25** |

**58% da fila é lixo.** Uma tela construída só pela etapa manda separar 60
pedidos quando existem 25.

E não dá para filtrar na origem: `cancelado` é recusado como parâmetro de
`ListarPedidos` com `Client-5001` ✅. **O cruzamento em memória é obrigatório**,
não otimização — ver [pedido-venda/armadilhas.md](pedido-venda/armadilhas.md).

## A sequência

| # | Chamada | Recurso | Param | Devolve |
|---|---|---|---|---|
| 1 | `ListarPedidos` | `produtos/pedido` | `pagina: 1`, `registros_por_pagina: 100`, `etapa: "20"` | os 60 pedidos da etapa, com `det[]` ✅ |
| 2 | `ListarEtapasFaturamento` | `produtos/etapafat` | `pagina: 1`, `registros_por_pagina: 50` | catálogo; use a operação `"11"` ✅ |
| 3 | filtro em memória | — | `infoCadastro.cancelado !== "S"` | a fila de 25 ✅ |

O filtro do passo 3 acontece **depois** de baixar a etapa inteira, e é por isso
que o passo 1 pede 100 por página: a fila cabe numa página só. Ver a seção
[Nunca pagine a etapa](#nunca-pagine-a-etapa).

Esta é a única das três receitas que **não precisa do catálogo de produtos**:
`det[].produto` já traz `codigo`, `descricao`, `quantidade` e `unidade` ✅.

## O custo

| Passo | Requisições |
|---|---|
| `ListarPedidos` da etapa `"20"` | 1 |
| Catálogo de etapas (uma vez por sessão) | 1 |
| **Total, catálogo quente** | **1** |

Uma página de 100 pedidos pesa ~165 KB ✅ — o custo aqui é de banda, não de
requisição. `apenas_resumo: "S"` corta isso em 7×, mas **descarta `det`** ✅:
serve para contar a fila, não para montar a lista de separação.

## O shape agregado

Estrutura sugerida; as contagens são as observadas ✅, os textos são
ilustrativos.

```json
{
  "geradoEm": "2026-08-10T21:00:00Z",
  "etapaCodigo": "20",
  "etapaNome": "Separar Estoque",
  "totalNaEtapa": 60,
  "cancelados": 35,
  "fila": 25,
  "pedidos": [
    {
      "pedidoId": "<codigo_pedido>",
      "pedidoNumero": "<numero_pedido>",
      "clienteId": "<codigo_cliente>",
      "clienteNome": "<razao_social>",
      "dataPrevisao": "2026-08-12",
      "cancelado": false,
      "itens": [
        {
          "produtoId": "<codigo_produto>",
          "produtoSku": "<codigo>",
          "produtoDescricao": "<descricao>",
          "quantidade": 12,
          "unidade": "UN"
        }
      ]
    }
  ],
  "porProduto": [
    { "produtoId": "<codigo_produto>", "quantidadeTotal": 37, "pedidos": 3 }
  ]
}
```

### Por que `totalNaEtapa` e `cancelados` aparecem

Exibir só `fila: 25` esconde a informação de que 35 pedidos estão presos na
etapa. Os três números juntos deixam o problema visível para quem opera o ERP —
e explicam por que a tela discorda do total que a Omie mostra.

### `porProduto` é a resposta que o separador quer

A lista por pedido responde "para quem"; a agregação por produto responde
"quanto tirar da prateleira". Some `quantidade` por `produtoId` sobre a fila
**já filtrada**.

### O nome do cliente custa chamadas

`ListarPedidos` traz `codigo_cliente` sem razão social ✅. Resolver o nome é o
mesmo problema N+1 do nome do produto na
[receita 1](90-receita-ops-abertas.md): indexe os clientes uma vez em vez de
consultar por pedido.

## Nunca pagine a etapa

Paginar na Omie e filtrar cancelados depois produz os dois defeitos ao mesmo
tempo:

| Defeito | Como aparece |
|---|---|
| Página com buracos | Pediu 20, exibe 8 — os outros 12 eram cancelados |
| Total inflado | `total_de_registros` é 60, a fila é 25 |

Baixe a etapa inteira, filtre, **e só então pagine em cima do resultado**. É a
regra 3 de [90-modelo-frontend.md](90-modelo-frontend.md), e o defeito existe
hoje na camada própria — ver
[91-gaps-camada-propria.md](91-gaps-camada-propria.md).

## Variações

**Outra etapa.** O código `"20"` vale na operação `"11"`. O mesmo `"20"` é
"LOJA" na operação `"28"` (ordem de produção) ✅ — resolva sempre pelo par
operação + código.

**Recorte por data.** `filtrar_por_data_de` + `filtrar_por_data_ate`, sempre o
par: mandar só `_ate` faz a Omie assumir **hoje** como início e devolver vazio
sem erro ✅.

## Próximo

- [pedido-venda/leitura-filtros.md](pedido-venda/leitura-filtros.md) — os cinco
  filtros reais
- [pedido-venda/etapas.md](pedido-venda/etapas.md) — o catálogo
- [91-gaps-camada-propria.md](91-gaps-camada-propria.md) — a receita 3 já existe
  como ferramenta
