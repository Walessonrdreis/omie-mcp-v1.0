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
| `SOAP-ENV:Client-5113` | Página sem registros | **Fim da paginação**, não falha 🔧 |
| `SOAP-ENV:Client-500` | Consumo indevido (volume) | Esperar e repetir 🔧 |
| `SOAP-ENV:Client-6` | Consumo redundante (frequência) | Esperar e repetir 🔧 |
| `SOAP-ENV:Client-105` | Valor fora do enum aceito | Corrigir o payload; a mensagem lista as opções válidas 🔧 |
| `SOAP-ENV:Client-103` | Registro não encontrado — **e o significado depende do recurso** | Ver abaixo ✅ |
| `SOAP-ENV:Client-5001` | Parâmetro que não existe no request daquele método | Corrigir o payload; a mensagem nomeia a tag e o tipo ✅ |

O `Client-105` é generoso de um jeito raro: quando você manda um valor inválido
num campo de enum, a mensagem de erro **enumera os valores aceitos**. Foi assim
que o enum de motivo de ajuste de estoque foi descoberto — a doc pública não o
documenta 🔧 (`src/modules/estoque/domain/interfaces/estoque-gateway.ts:18-24`).

O `Client-103` diz `"Produto não encontrado!"` mesmo quando o produto existe: em
`geral/malha` ele significa **"este produto não tem estrutura cadastrada"** ✅.
Não propague a mensagem da Omie para o usuário sem saber de qual recurso ela
veio — ver [../estrutura/armadilhas.md](../estrutura/armadilhas.md).

O `Client-5001` é o oposto do comportamento tolerante que se costuma esperar: a
Omie **não ignora** parâmetro desconhecido, ela recusa a chamada nomeando a tag
e o tipo complexo do request ✅. Bom para achar erro de digitação cedo, ruim
para quem tenta descobrir filtro não documentado por tentativa.

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
