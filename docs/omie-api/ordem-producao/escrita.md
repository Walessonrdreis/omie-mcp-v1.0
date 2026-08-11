# Ordem de produção — escrita

`IncluirOrdemProducao`, `AlterarOrdemProducao` e `ExcluirOrdemProducao`, no
recurso `produtos/op`.

← [Ordem de produção](README.md) · [Índice](../README.md)

> ⚠️ **Nada nesta página foi executado contra a conta real.** Tudo vem do código
> que roda em produção (🔧) ou da doc oficial (📖). Onde há `✅`, a evidência é de
> **leitura** — o formato de um campo observado na resposta, não o efeito de
> gravá-lo.

## O wrapper `identificacao` só existe na escrita

A assimetria própria do recurso, e o erro mais provável de quem generaliza um
helper 🔧 (`op-omie-gateway.ts:39,47` × `:31,55`):

| Método | Formato do `param` |
|---|---|
| `IncluirOrdemProducao` | `{ "identificacao": { ...campos } }` |
| `AlterarOrdemProducao` | `{ "identificacao": { ...campos } }` |
| `ConsultarOrdemProducao` | `{ "nCodOP": ... }` — raiz |
| `ExcluirOrdemProducao` | `{ "nCodOP": ... }` — raiz |

Não há razão visível para a diferença: `identificacao` é o nome de um bloco da
**resposta**, e a escrita reaproveita esse nome como envelope de entrada. As
outras três chaves da resposta (`infAdicionais`, `outrasInf`, `observacoes`) não
aparecem no que este gateway grava.

Mandar os campos na raiz de um `Incluir` provavelmente cai em `Client-5001`
nomeando a tag, como todo o resto do recurso — mas isso **não foi testado**.

## `IncluirOrdemProducao` / `AlterarOrdemProducao`

Campos de `DadosOPParaGravar` 🔧 (`op-gateway.ts:43-50`), todos dentro de
`identificacao`:

| Campo | Tipo | Obrigatório | O que faz |
|---|---|---|---|
| `nCodProduto` | number | 🔧 sim | Produto a produzir; precisa ter estrutura |
| `nQtde` | number | 🔧 sim | Quantidade a produzir |
| `dDtPrevisao` | string | 🔧 sim | Data prevista, `dd/mm/aaaa` |
| `codigo_local_estoque` | number | 🔧 sim | Local do produto acabado; `0` = padrão |
| `nCodOP` | number | 🔧 não | Chave no `Alterar` |
| `cCodIntOP` | string | 🔧 não | Chave alternativa no `Alterar` |

```json
{
  "call": "IncluirOrdemProducao",
  "app_key": "SUA_APP_KEY",
  "app_secret": "SEU_APP_SECRET",
  "param": [{
    "identificacao": {
      "nCodProduto": 9116172204,
      "nQtde": 82,
      "dDtPrevisao": "07/08/2026",
      "codigo_local_estoque": 0
    }
  }]
}
```

`codigo_local_estoque` **é obrigatório mesmo na inclusão mais simples**, com `0`
significando o local padrão 🔧 — o comentário de `op-gateway.ts:38-42` registra
que isso foi testado ao vivo antes desta coleta. Nem todo local aceita OP: dos
15 locais desta conta, só três trazem `dispOrdemProducao: "S"` ✅ — ver
[../estoque/leitura.md](../estoque/leitura.md).

## O produto precisa ter estrutura antes

A OP é o terceiro elo da cadeia **produto → malha → OP**, e a Omie recusa a
criação se o segundo estiver faltando 🔧 (`op-gateway.ts:38-42`).

Antes de incluir, confirme a ficha técnica com `ConsultarEstrutura` —
[../estrutura/README.md](../estrutura/README.md). Nesta conta, 653 dos 2021
produtos têm estrutura ✅: a maioria dos códigos **não** pode virar OP.

O código de erro devolvido nesse caso não foi capturado.

## O que não dá para gravar por aqui

`DadosOPParaGravar` cobre quatro campos de `identificacao`. Tudo o mais que a OP
tem na leitura fica de fora 🔧:

| Fora do payload | Consequência |
|---|---|
| `cEtapa` | A OP nasce na etapa que a Omie decidir; mover no kanban não é operação deste gateway |
| `dDtInicio`, `dDtConclusao`, `nCodProjeto` | Só a data de previsão é definível |
| `itensDetalhes` | Os insumos vêm da estrutura, não do payload |
| `cObs` | Sem observação na criação |

Se a API oficial aceita os blocos `infAdicionais` e `itensDetalhes` na inclusão
**não foi verificado** 📖 — o que se sabe é que este gateway não os envia. Isso
não deixa a OP sem insumos: em toda OP observada, os itens correspondem à ficha
técnica multiplicada pela quantidade ✅ (ver
[campos-itens.md](campos-itens.md)), o que indica que a Omie os deriva da malha.
Por quem essas OPs foram criadas — API ou tela — não é distinguível na resposta.

## `ExcluirOrdemProducao`

Param: a chave na raiz, `{ nCodOP }` ou `{ cCodIntOP }` 🔧
(`op-omie-gateway.ts:51-57`). Como `cCodIntOP` vem `""` em toda a conta ✅, na
prática é sempre `nCodOP`.

O que a exclusão faz com o estoque já movimentado por uma OP concluída **não foi
verificado**. Considerando o que o ajuste de estoque ensinou — o movimento
sobrevive à exclusão do documento, ver
[../estoque/escrita.md](../estoque/escrita.md) — trate exclusão de OP concluída
como operação de risco até provar o contrário em sandbox.

## Resposta

Os três métodos devolvem `StatusOPOmie` 🔧 (`op-gateway.ts:52-57`):

| Campo | Tipo | Significado |
|---|---|---|
| `nCodOP` | number | ID da OP criada ou afetada |
| `cCodIntOP` | string | Código de integração ecoado |
| `cCodStatus` | string | Código curto do resultado |
| `cDesStatus` | string | Mensagem legível |

É o par código + descrição de sempre, no terceiro nome diferente — ver
[../glossario/campos.md](../glossario/campos.md). **Guarde `nCodOP`**: sem ele e
sem `cCodIntOP` preenchido, a OP só é reencontrável varrendo a listagem.

Falha não vem por status HTTP — vem como `faultstring` em HTTP 200, ver
[../convencoes/erros.md](../convencoes/erros.md).

## Próximo

- [armadilhas.md](armadilhas.md) — inclusive a assimetria do wrapper
- [leitura.md](leitura.md) — `Listar` e `Consultar`
