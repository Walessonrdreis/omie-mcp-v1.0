# Pedido de venda — escrita

`IncluirPedido`, `AlterarPedidoVenda` e `ExcluirPedido`, no recurso
`produtos/pedido`.

← [Pedido de venda](README.md) · [Índice](../README.md)

> ⚠️ **Dois avisos, e os dois valem.**
>
> **1. Isto está fora do escopo desta doc.** Só a *leitura* de pedido de venda
> foi documentada — ver o Escopo em [../README.md](../README.md). Esta página é
> um resumo mínimo para quem esbarrar no assunto, não uma referência de CRUD.
> Quem precisa do CRUD completo vai para
> [`../../FERRAMENTAS.md`](../../FERRAMENTAS.md).
>
> **2. Nada aqui foi executado contra a conta real.** Tudo vem do código que
> roda em produção (🔧). Onde há `✅`, a evidência é de **leitura** — o formato
> de um campo observado na resposta, não o efeito de gravá-lo.

## Os três métodos

| Método | `call` | Formato do `param` |
|---|---|---|
| Incluir | `IncluirPedido` | `cabecalho` + `informacoes_adicionais` + `det[]` |
| Alterar | **`AlterarPedidoVenda`** | Idêntico ao incluir |
| Excluir | `ExcluirPedido` | A chave na raiz |

**O nome do método de alteração foge do padrão** 🔧
(`pedido-venda-omie-gateway.ts:108,116,124`). Os irmãos são `IncluirPedido`,
`ExcluirPedido` e `ConsultarPedido` — todos sem sufixo. Só a alteração é
`AlterarPedidoVenda`. Ver [armadilhas.md](armadilhas.md).

## Três exigências que derrubam a primeira tentativa

Registradas no código a partir de teste ao vivo anterior a esta coleta 🔧
(`pedido-venda-gateway.ts:63-68`):

1. **O cliente precisa ter UF preenchida no cadastro.** Sem ela a Omie recusa o
   pedido — e o erro fala do pedido, não do cliente.
2. **`codigo_categoria` é obrigatório**, mesmo num pedido simples.
3. **`codigo_conta_corrente` é obrigatório**, idem.

Os dois últimos são campos financeiros: **não há como criar o pedido agora e
resolver o financeiro depois** 🔧. Quem monta uma tela de pedido precisa dos
catálogos de categoria e de conta corrente antes de deixar o usuário salvar.

Os valores válidos aparecem na leitura de qualquer pedido existente, em
`informacoes_adicionais` ✅ — ver [campos.md](campos.md).

## O payload

O gateway monta três blocos 🔧 (`pedido-venda-omie-gateway.ts:79-103`):

```json
{
  "cabecalho": {
    "codigo_cliente": 9162565190,
    "data_previsao": "13/03/2024",
    "etapa": "10",
    "codigo_parcela": "000"
  },
  "informacoes_adicionais": {
    "codigo_categoria": "1.01.03",
    "codigo_conta_corrente": 9114502812,
    "consumidor_final": "N"
  },
  "det": [{
    "ide": { "codigo_item_integracao": "ITEM-1" },
    "produto": { "codigo_produto": 9116172320, "quantidade": 100, "valor_unitario": 9 }
  }]
}
```

Três defaults do repo, não da Omie 🔧: `etapa` cai para `"10"`,
`codigo_parcela` para `"000"` e `consumidor_final` para `"N"`. O `"10"` é
"Orçamento e Proposta" nesta conta ✅ — ver [etapas.md](etapas.md).

Note a assimetria com a leitura: `det[].produto` **grava** três campos e **lê**
vinte e um ✅. Preço e quantidade entram; descrição, SKU, NCM e CFOP a Omie
resolve a partir do cadastro do produto.

## `ExcluirPedido`

Param é a chave na raiz, `codigo_pedido` **ou** `codigo_pedido_integracao` 🔧
(`pedido-venda-omie-gateway.ts:121-127`) — a mesma `ChavePedido` do
`ConsultarPedido`, e aqui as duas servem de verdade, porque o código de
integração é preenchido nesta conta ✅.

O que a exclusão faz com um pedido já faturado **não foi verificado**. O
`infoCadastro` distingue `cancelado` de excluído ✅, então cancelar pela tela e
excluir pela API provavelmente não são a mesma operação — trate como risco até
provar o contrário em sandbox.

## Resposta

Os três métodos devolvem `StatusPedidoOmie` 🔧 (`pedido-venda-gateway.ts:82-88`):

| Campo | Tipo | Significado |
|---|---|---|
| `codigo_pedido` | number | ID do pedido criado ou afetado |
| `codigo_pedido_integracao` | string | Código de integração ecoado |
| `numero_pedido` | string | Número visível |
| `codigo_status` | string | Código curto do resultado |
| `descricao_status` | string | Mensagem legível |

É o par código + descrição de sempre — ver
[../glossario/campos.md](../glossario/campos.md). Falha não vem por status HTTP:
vem como `faultstring` em HTTP 200, ver
[../convencoes/erros.md](../convencoes/erros.md).

## Para o CRUD de verdade

Esta página cobre o mínimo. Assinatura das tools, argumentos e retorno estão em
[`../../FERRAMENTAS.md`](../../FERRAMENTAS.md) — a fronteira entre as duas docs
está explicada em [../README.md](../README.md).

## Próximo

- [armadilhas.md](armadilhas.md) — inclusive o nome fora do padrão
- [leitura.md](leitura.md) — `Listar` e `Consultar`
