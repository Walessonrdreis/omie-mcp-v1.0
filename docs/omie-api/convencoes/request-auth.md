# Requisição e autenticação

Toda a API da Omie tem o mesmo formato. Aprender uma chamada é aprender todas.

← [Índice](../README.md)

## A forma da chamada

Sempre `POST`. Sempre `Content-Type: application/json`. Nunca `GET`, nunca
query string 🔧

```
POST https://app.omie.com.br/api/v1/{recurso}/
```

**A barra final é obrigatória** 🔧 — o cliente do repo a garante ao montar a URL
(`src/integrations/omie/omieClient.ts:99`). Sem ela a Omie recusa.

`{recurso}` é o caminho de duas partes que identifica o módulo, ex:
`geral/produtos`, `geral/malha`, `produtos/op`, `estoque/consulta`.

## O corpo

```json
{
  "call": "ListarProdutos",
  "app_key": "SUA_APP_KEY",
  "app_secret": "SEU_APP_SECRET",
  "param": [
    {
      "pagina": 1,
      "registros_por_pagina": 50
    }
  ]
}
```

Quatro campos, sempre os mesmos:

| Campo | Tipo | O que é |
|---|---|---|
| `call` | string | Nome do método, ex: `ListarProdutos` 🔧 |
| `app_key` | string | Credencial da conta 🔧 |
| `app_secret` | string | Credencial da conta 🔧 |
| `param` | array | **Array de exatamente um objeto** 🔧 |

## Duas coisas que derrubam quem começa

**1. `param` é um array, não um objeto.** O erro mais comum é mandar
`"param": { ... }` — a Omie recusa. É sempre `"param": [ { ... } ]`, com um
único elemento 🔧 (`omieClient.ts:105`).

**2. A credencial vai no corpo, não em header.** Não existe `Authorization`,
não existe Bearer, não existe token de sessão. `app_key` e `app_secret` viajam
dentro do JSON, em toda chamada 🔧.

Consequência prática: **nunca chame a Omie direto do navegador.** As
credenciais estariam no código do front. Toda chamada precisa passar por um
backend seu — é uma das razões da camada própria deste repo.

## O método vai no corpo, não na URL

O mesmo endpoint atende inclusão, alteração, exclusão e consulta — o que muda é
o `call` 🔧:

| `call` | Recurso | O que faz |
|---|---|---|
| `ListarProdutos` | `geral/produtos` | Lista paginada |
| `ConsultarProduto` | `geral/produtos` | Consulta um |
| `IncluirProduto` | `geral/produtos` | Cria |
| `AlterarProduto` | `geral/produtos` | Altera |
| `ExcluirProduto` | `geral/produtos` | Exclui |

Roteamento por HTTP (verbo + path) não funciona aqui. Se você está desenhando
uma camada própria em cima disso, o mapeamento REST → Omie é seu trabalho.

## Espaçamento entre chamadas

A Omie bloqueia chamadas próximas demais, mesmo dentro do limite de volume. O
cliente deste repo garante **300ms entre o início de duas requisições** da mesma
instância 🔧 (`omieClient.ts:23,172-176`), inclusive quando várias partem juntas
de um `Promise.all`.

Isso não é opcional em código de produção: sem o espaçamento, um laço de
paginação normal cai em "consumo redundante" — ver [erros.md](erros.md).

Consequência de projeto: **chamada à Omie é cara em tempo.** Uma tela que
precisa de 40 produtos leva no mínimo 12 segundos se resolver produto a
produto. Ver `90-modelo-frontend.md` (fase v3).

## Exemplo completo

```bash
curl -X POST https://app.omie.com.br/api/v1/geral/produtos/ \
  -H "Content-Type: application/json" \
  -d '{
    "call": "ListarProdutos",
    "app_key": "SUA_APP_KEY",
    "app_secret": "SEU_APP_SECRET",
    "param": [{
      "pagina": 1,
      "registros_por_pagina": 50,
      "apenas_importado_api": "N",
      "filtrar_apenas_omiepdv": "N"
    }]
  }'
```

Os dois últimos parâmetros são exigidos por `ListarProdutos` especificamente 🔧
— ver `produtos/leitura.md` (fase v1).

## Próximo

- [paginacao.md](paginacao.md) — como percorrer uma listagem inteira
- [erros.md](erros.md) — por que HTTP 200 não significa sucesso
