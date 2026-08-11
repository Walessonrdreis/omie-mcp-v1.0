# Erros

← [Índice](../README.md)

## HTTP 200 não significa sucesso

A Omie devolve erro **dentro do corpo, com status HTTP 200** 🔧
(`src/integrations/omie/omieClient.ts:129-131`). Código que confere só
`response.ok` trata falha como sucesso e segue com dado vazio.

Um erro tem esta cara:

```json
{
  "faultstring": "Não existem registros para a página informada",
  "faultcode": "SOAP-ENV:Client-5113"
}
```

A regra: **depois de parsear o JSON, cheque `faultstring`/`faultcode` antes de
qualquer outra coisa** — inclusive antes de olhar o status HTTP 🔧.

A Omie *também* usa status não-2xx em alguns casos (notadamente rate limit), então
as duas checagens são necessárias — nenhuma substitui a outra.

## Códigos observados

| Código | Significa | Como tratar |
|---|---|---|
| `SOAP-ENV:Client-5113` | Página sem registros — **ou filtro sem resultado** | **Fim da paginação**, não falha ✅ |
| `SOAP-ENV:Client-500` | Consumo indevido (volume) | Esperar e repetir 🔧 |
| `SOAP-ENV:Client-6` | Consumo redundante (frequência) | Esperar e repetir 🔧 |
| `SOAP-ENV:Client-105` | Valor fora do enum aceito **ou** registro não encontrado | Depende do recurso — ver abaixo ✅ |
| `SOAP-ENV:Client-104` | Data fora da faixa aceita (ano ≤ 1900) | Corrigir o payload; a mensagem nomeia a tag ✅ |
| `SOAP-ENV:Client-103` | Registro não encontrado — **e o significado depende do recurso** | Ver abaixo ✅ |
| `SOAP-ENV:Client-5001` | Parâmetro que não existe no request daquele método | Corrigir o payload; a mensagem nomeia a tag e o tipo ✅ |
| `SOAP-ENV:Client-1070` | Código de local de estoque não cadastrado | Corrigir o payload; a mensagem nomeia o código e a tag ✅ |

O `Client-105` é generoso de um jeito raro: quando você manda um valor inválido
num campo de enum, a mensagem de erro **enumera os valores aceitos**. Foi assim
que o enum de motivo de ajuste de estoque foi descoberto — a doc pública não o
documenta 🔧 (`src/modules/estoque/domain/interfaces/estoque-gateway.ts:18-24`).

**Mas o mesmo código serve para "registro não encontrado"** ✅. `ConsultarPedido`
com um `codigo_pedido` inexistente devolve `Client-105`, não `Client-103`:

```
SOAP-ENV:Client-105
ERROR: Pedido não cadastrado para o Código [1] !
```

Ou seja, `103` e `105` se sobrepõem, e **nenhum dos dois é confiável como
discriminador**. Classifique pela `faultstring`, não pelo código.

O `Client-103` diz `"Produto não encontrado!"` mesmo quando o produto existe: em
`geral/malha` ele significa **"este produto não tem estrutura cadastrada"** ✅.
Não propague a mensagem da Omie para o usuário sem saber de qual recurso ela
veio — ver [../estrutura/armadilhas.md](../estrutura/armadilhas.md).

O `Client-5001` é o oposto do comportamento tolerante que se costuma esperar: a
Omie **não ignora** parâmetro desconhecido, ela recusa a chamada nomeando a tag
e o tipo complexo do request ✅. Bom para achar erro de digitação cedo, ruim
para quem tenta descobrir filtro não documentado por tentativa.

Verificado em quatro recursos ✅ — `geral/malha`, `estoque/consulta`,
`produtos/op` e `produtos/pedido`. A mensagem nomeia **uma tag por resposta**,
mesmo quando várias estão erradas: sondar um request desconhecido é um ciclo de
tentativa e erro, uma tag por vez ✅.

O tipo complexo nomeado é **por método**, não por recurso: `pvpListarRequest` no
`ListarPedidos` e `pvpConsultarRequest` no `ConsultarPedido` ✅. Um parâmetro
aceito num método pode ser recusado no outro.

## O `Client-5113` também significa "filtro sem resultado"

A leitura óbvia é "acabou a paginação", e é assim que ele deve ser tratado. Mas
ele aparece também quando **a página 1 de um filtro válido não tem registros**
✅ — `ListarPedidos` com uma etapa que existe e está vazia devolve exatamente a
mesma coisa que uma etapa inexistente:

```
SOAP-ENV:Client-5113
ERROR: Não existem registros para a página [1]!
```

Consequência que morde: um relatório com filtro errado volta **vazio e sem
erro**, porque o cliente traduz `5113` para lista vazia. O caso concreto é
`filtrar_por_data_ate` sem `_de`, que a Omie interpreta como "de hoje até a data
informada" — ver
[../pedido-venda/armadilhas.md](../pedido-venda/armadilhas.md). Valide os
filtros antes de enviar; a API não vai reclamar deles.

O `Client-1070` mostra o outro lado da moeda: a tag `codigo_local_estoque`
existe, então não é `Client-5001` — é o **valor** que não corresponde a nenhum
local cadastrado ✅. Tag errada e valor errado têm códigos diferentes, e só o
segundo depende dos dados da conta.

## Rate limit tem dois sabores

São coisas diferentes e se resolvem igual (esperar), mas ajuda saber qual é:

- **Consumo indevido** (`Client-500`, ou HTTP 425/429) — volume alto demais 🔧
- **Consumo redundante** (`Client-6`) — chamadas próximas demais no tempo, mesmo
  em volume baixo 🔧

O segundo é o que pega quem pagina em laço apertado. Prevenir é melhor que
tratar: mantenha o espaçamento mínimo de 300ms entre chamadas
(ver [request-auth.md](request-auth.md)).

## A Omie às vezes diz quanto esperar

Quando o bloqueio é temporário, a mensagem pode conter a espera em segundos 🔧
(`omieClient.ts:55-58`):

```
Aguarde 57 segundos para efetuar a requisição.
```

Respeite o número da mensagem em vez de usar um backoff fixo — repetir antes
disso só renova o bloqueio.

## Política de retry deste repo

Implementada uma vez no cliente, vale para todos os módulos 🔧
(`omieClient.ts:108-158`):

| Situação | Tratamento |
|---|---|
| Mensagem diz "Aguarde N segundos" | Espera `N + 1` segundos |
| Rate limit sem número na mensagem | Espera 2 segundos |
| Falha de rede / resposta não-JSON | Backoff linear: 500ms, 1s, 1,5s |
| Erro de negócio | **Sem retry** — falha na hora |

Máximo de 4 tentativas.

A distinção que importa: **erro de negócio não é retentável** 🔧. Campo
obrigatório faltando, código inexistente, valor fora do enum — repetir só gasta
chamada. Só bloqueio momentâneo merece nova tentativa.

## Resposta que não é JSON

A Omie ocasionalmente devolve HTML (página de erro do servidor) em vez de JSON.
O parse falha antes de qualquer checagem de `faultstring`, então esse caso
precisa de tratamento próprio 🔧 (`omieClient.ts:120-127`) — e entra no retry de
falha de rede, não no de negócio.

## Como isso afeta o frontend

Traduza os erros da Omie na borda, para o front nunca ver `SOAP-ENV:*`:

| Situação Omie | O que o front deve receber |
|---|---|
| `Client-5113` na paginação | Lista vazia, status 200 |
| Rate limit persistente | 503 com "tente novamente em instantes" |
| Erro de negócio | 400 com a `faultstring` traduzida |
| Credencial inválida | 500 — é erro de configuração sua, não do usuário |

## Próximo

- [tipos-formatos.md](tipos-formatos.md) — datas, decimais e flags `"S"`/`"N"`
- [paginacao.md](paginacao.md) — onde o `Client-5113` aparece na prática
