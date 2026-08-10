# Estoque — escrita

`IncluirAjusteEstoque` e `ExcluirAjusteEstoque`, no recurso `estoque/ajuste`.

← [Estoque](README.md) · [Índice](../README.md)

> ⚠️ **Nada nesta página foi executado contra a conta real.** Ajuste de estoque
> é a operação **menos reversível** de toda esta doc — ver a seção final. Tudo
> aqui vem do código que roda em produção (🔧) ou da doc oficial (📖).

## O ajuste fala snake, a consulta fala húngaro

`estoque/consulta` e `estoque/ajuste` são o mesmo módulo no nome e **dialetos
diferentes na prática** 🔧:

| Sub-recurso | Estilo | Exemplos |
|---|---|---|
| `estoque/consulta` | húngaro | `nPagina`, `nCodProd`, `nSaldo` |
| `estoque/ajuste` | snake | `id_prod`, `quan`, `codigo_local_estoque` |

O mesmo produto é `nCodProd` quando você lê e `id_prod` quando você escreve. Não
há um único campo em comum entre os dois payloads. Ver
[../glossario/campos.md](../glossario/campos.md).

## `IncluirAjusteEstoque`

Param: os campos de `DadosAjusteEstoqueParaGravar` no nível de cima 🔧
(`estoque-omie-gateway.ts:61-67`) — não há bloco aninhado.

| Campo | Tipo | Obrigatório | O que faz |
|---|---|---|---|
| `id_prod` | number | 🔧 sim | ID interno do produto (`nCodProd` na leitura) |
| `data` | string | 🔧 sim | Data do ajuste, `dd/mm/aaaa` |
| `tipo` | string | 🔧 sim | Natureza do movimento — enum abaixo |
| `quan` | number | 🔧 sim | Quantidade ajustada |
| `origem` | string | 🔧 sim | Origem do lançamento — enum abaixo |
| `motivo` | string | 🔧 sim | Justificativa — enum abaixo |
| `valor` | number | 🔧 não | Valor unitário; alimenta o custo médio |
| `obs` | string | 🔧 não | Observação livre |
| `codigo_local_estoque` | number | 🔧 não | Local de origem |
| `codigo_local_estoque_destino` | number | 🔧 não | Local de destino, só para `TRF` |

```json
{
  "call": "IncluirAjusteEstoque",
  "app_key": "SUA_APP_KEY",
  "app_secret": "SEU_APP_SECRET",
  "param": [{
    "id_prod": 9116171990,
    "data": "10/08/2026",
    "tipo": "ENT",
    "quan": 12,
    "origem": "AJU",
    "motivo": "INV"
  }]
}
```

## Os três enums

A doc pública **não documenta nenhum dos três** 🔧. Os valores abaixo estão em
`estoque-gateway.ts:18-37`, e o de `motivo` foi descoberto ao vivo pelo erro
`SOAP-ENV:Client-105`, que lista as opções válidas na mensagem 🔧.

| Campo | Valores aceitos | Significado |
|---|---|---|
| `tipo` | `ENT`, `SAI`, `SLD`, `TRF` | Entrada, saída, saldo, transferência |
| `origem` | `AJU`, `PDV` | Ajuste manual, ponto de venda |
| `motivo` | `INI`, `INV`, `OPE`, `PDV` | Estoque inicial, inventário, operacional, PDV |

Como o enum é rejeitado em vez de ignorado, errar o valor custa uma chamada e
devolve a lista certa. É a forma mais barata de confirmar essas opções na sua
conta — ver [../convencoes/erros.md](../convencoes/erros.md).

### O que ninguém verificou

A lista de valores é certa; **o efeito de cada um não foi confirmado por
ninguém** — nem por esta coleta, que não escreve, nem pelo código, que só
repassa o valor recebido. Duas perguntas em aberto, das quais depende o
resultado de um ajuste:

1. `SLD` **define** o saldo ou **soma** como `ENT`? O nome sugere "deixe o
   produto com exatamente `quan`", mas nada no repo confirma. A diferença entre
   as duas leituras é o estoque inteiro do produto.
2. `TRF` exige `codigo_local_estoque_destino`? O campo é opcional na interface
   🔧, e uma transferência sem destino não tem sentido óbvio.

Confirme as duas em conta de sandbox antes do primeiro ajuste em produção. Se
você tentar descobrir em produção, lembre da seção final desta página: o produto
que receber o ajuste de teste nunca mais poderá ser excluído.

## `ExcluirAjusteEstoque`

Param: `{ id_ajuste }` 🔧 (`estoque-omie-gateway.ts:75-81`). O `id_ajuste` vem
da resposta da inclusão — **guarde-o**, não há como listar ajustes por produto
neste recurso.

```json
{
  "call": "ExcluirAjusteEstoque",
  "app_key": "SUA_APP_KEY",
  "app_secret": "SEU_APP_SECRET",
  "param": [{ "id_ajuste": 9301904932 }]
}
```

## Resposta

Os dois métodos devolvem `StatusAjusteEstoqueOmie` 🔧
(`estoque-gateway.ts:39-44`):

| Campo | Tipo | Significado |
|---|---|---|
| `codigo_status` | string | Código curto do resultado |
| `descricao_status` | string | Mensagem legível |
| `id_ajuste` | number | ID do ajuste — o que `ExcluirAjusteEstoque` consome |
| `id_movest` | number | ID do movimento de estoque gerado |

Os **dois** IDs importam, e por razões diferentes: `id_ajuste` é o que você pode
desfazer, `id_movest` é o que fica para sempre. A próxima seção explica por quê.

Falha não vem por status HTTP — vem como `faultstring` em HTTP 200, ver
[../convencoes/erros.md](../convencoes/erros.md).

## O ajuste é irreversível sobre o ciclo de vida do produto

O achado mais caro deste recurso, testado ao vivo antes desta coleta 🔧
(`estoque-gateway.ts:66-72`):

**A Omie exclui o ajuste normalmente. O "Movimento de Estoque (calculado)"
resultante fica registrado no produto para sempre.** A partir do primeiro
ajuste, `ExcluirProduto` recusa com erro de dependência — permanentemente,
mesmo com o ajuste já excluído.

`ExcluirAjusteEstoque` desfaz o número, não o fato. Não existe desfazer completo.

O que fazer com isso:

- Trate `IncluirAjusteEstoque` como **operação de sentido único** sobre a
  possibilidade de excluir aquele produto.
- Nunca ajuste estoque de produto de teste em conta de produção.
- Em produção, prefira **inativar** (`inativo: "S"`) a excluir — ver
  [../produtos/armadilhas.md](../produtos/armadilhas.md).
- Se sua UI expõe ajuste de estoque, avise antes de gravar. O usuário não tem
  como saber que está queimando uma porta.

Detalhado em [armadilhas.md](armadilhas.md).

## Próximo

- [armadilhas.md](armadilhas.md) — inclusive as armadilhas de escrita
- [leitura.md](leitura.md) — `ListarPosEstoque`
