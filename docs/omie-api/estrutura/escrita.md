# Estrutura — escrita

`IncluirEstrutura`, `AlterarEstrutura` e `ExcluirEstrutura`, no recurso
`geral/malha`.

← [Estrutura](README.md) · [Índice](../README.md)

> ⚠️ **Nada nesta página foi executado contra a conta real.** Escrita é
> irreversível e esta doc foi levantada só com leitura. Tudo aqui vem do código
> que roda em produção (🔧) ou da doc oficial da Omie (📖). Quando as duas
> fontes divergem, o código ganha e a divergência vira item de
> [armadilhas.md](armadilhas.md).

Os três métodos operam sobre **itens**, não sobre a estrutura inteira: o param
é sempre `idProduto` (o pai) mais o que fazer com as linhas 🔧
(`estrutura-omie-gateway.ts:34-62`). Não existe "substituir a ficha técnica" —
você inclui, altera e exclui linha a linha.

## `IncluirEstrutura`

Param: `{ idProduto, itemMalhaIncluir: [...] }` 🔧
(`estrutura-omie-gateway.ts:41`).

Campos de cada item, a partir de `ItemEstruturaParaIncluir`
(`estrutura-gateway.ts:58-64`):

| Campo | Tipo | Obrigatório | O que faz |
|---|---|---|---|
| `intMalha` | string | 🔧 **sim** | Sua chave para a **linha**. A doc oficial marca como opcional — ver abaixo |
| `idProdMalha` | number | 🔧 sim | ID do produto componente |
| `quantProdMalha` | number | 🔧 sim | Quantidade por unidade do pai |
| `percPerdaProdMalha` | number | 🔧 não | Percentual de perda previsto |
| `obsProdMalha` | string | 🔧 não | Observação da linha |

```json
{
  "call": "IncluirEstrutura",
  "app_key": "SUA_APP_KEY",
  "app_secret": "SEU_APP_SECRET",
  "param": [{
    "idProduto": 9116171984,
    "itemMalhaIncluir": [
      { "intMalha": "BOM-100P-01", "idProdMalha": 9207068440, "quantProdMalha": 0.031 }
    ]
  }]
}
```

### `intMalha` é obrigatório na prática

A doc pública marca como opcional; o comentário da interface registra o oposto,
verificado contra a API real (`estrutura-gateway.ts:53-57`) 🔧.

E ele é o identificador **do item dentro da malha**, não do produto componente.
Gerá-lo a partir do SKU do componente é a receita para colidir quando o mesmo
insumo aparece duas vezes na mesma ficha — derive da linha, não do produto.
Repetido em [armadilhas.md](armadilhas.md).

Note a assimetria com a leitura: `intMalha` é exigido na inclusão mas **nunca
volta** na resposta de `ListarEstruturas` ✅ (ver [campos.md](campos.md)). Você
manda uma chave que a API depois não te mostra — guarde do seu lado se pretende
usá-la.

## `AlterarEstrutura`

Param: `{ idProduto, itemMalhaAlterar: [...] }` 🔧
(`estrutura-omie-gateway.ts:52`).

Campos, de `ItemEstruturaParaAlterar` (`estrutura-gateway.ts:71-77`):

| Campo | Tipo | Obrigatório | O que faz |
|---|---|---|---|
| `idMalha` | number | 🔧 **sim** | Identifica a **linha** a alterar |
| `idProdMalha` | number | 🔧 **sim** | Identifica o **produto** da linha — exigido mesmo sem mudar |
| `quantProdMalha` | number | 🔧 não | Nova quantidade |
| `percPerdaProdMalha` | number | 🔧 não | Novo percentual de perda |
| `obsProdMalha` | string | 🔧 não | Nova observação |

A exigência dos dois IDs é o achado principal: **para mudar só a quantidade,
você precisa mandar `idMalha` e `idProdMalha`** 🔧
(`estrutura-gateway.ts:66-70`). O segundo é redundante — a linha já sabe qual é
o produto dela — mas a Omie recusa sem ele. `intProdMalha` serve como
alternativa a `idProdMalha` 📖.

```json
{
  "call": "AlterarEstrutura",
  "app_key": "SUA_APP_KEY",
  "app_secret": "SEU_APP_SECRET",
  "param": [{
    "idProduto": 9116171984,
    "itemMalhaAlterar": [
      { "idMalha": 9301904932, "idProdMalha": 9207068440, "quantProdMalha": 0.035 }
    ]
  }]
}
```

Trocar o componente de uma linha não é operação de alteração: `idProdMalha` é
parte da identificação, não campo alterável 📖. Para trocar o insumo, exclua a
linha e inclua outra.

## `ExcluirEstrutura`

Param: `{ idProduto, idMalha }` 🔧 (`estrutura-omie-gateway.ts:60`). Uma linha
por chamada — não aceita array.

```json
{
  "call": "ExcluirEstrutura",
  "app_key": "SUA_APP_KEY",
  "app_secret": "SEU_APP_SECRET",
  "param": [{ "idProduto": 9116171984, "idMalha": 9301904932 }]
}
```

## Respostas

`IncluirEstrutura` e `AlterarEstrutura` devolvem `itemMalhaStatus[]` — **uma
entrada por item enviado**, não um status único 🔧
(`estrutura-gateway.ts:79-90`):

| Campo | Tipo | Significado |
|---|---|---|
| `codStatus` | string | Código curto do resultado daquele item |
| `descrStatus` | string | Mensagem legível |
| `idMalha` | number | ID da linha afetada — é como você descobre o `idMalha` de um item recém-incluído |
| `idProdMalha` | number | ID do produto componente da linha |
| `intMalha` | string | A chave que você mandou |
| `intProdMalha` | string | Chave de integração do componente |

Consequência: um lote pode **suceder em parte**. Percorra o array inteiro em
vez de olhar só a primeira entrada.

`ExcluirEstrutura` devolve um objeto único, `ExcluirEstruturaStatus` 🔧
(`estrutura-gateway.ts:92-99`): `idProduto`, `intProduto`, `idMalha`,
`intMalha`, `codStatus`, `descrStatus`.

Nos três casos, falha **não** vem por status HTTP — vem como `faultstring` em
HTTP 200, ver [../convencoes/erros.md](../convencoes/erros.md).

## Próximo

- [armadilhas.md](armadilhas.md) — inclusive as armadilhas de escrita
- [leitura.md](leitura.md) — `Listar`/`Consultar`
