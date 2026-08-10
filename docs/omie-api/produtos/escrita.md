# Produtos — escrita

`IncluirProduto`, `AlterarProduto` e `ExcluirProduto`, no recurso
`geral/produtos`.

← [Produtos](README.md) · [Índice](../README.md)

> ⚠️ **Nada nesta página foi executado contra a conta real.** Escrita é
> irreversível e esta doc foi levantada só com leitura. Tudo aqui vem do código
> que roda em produção (🔧) ou da doc oficial da Omie (📖). Quando as duas
> fontes divergem, o código ganha e a divergência vira item de
> [armadilhas.md](armadilhas.md).

## `IncluirProduto`

Campos aceitos, a partir de `DadosProdutoParaGravar`
(`src/modules/produtos/domain/interfaces/produtos-gateway.ts:26-41`).

| Campo | Tipo | Obrigatório | O que faz |
|---|---|---|---|
| `codigo` | string | 🔧 **sim** | SKU. A doc oficial marca como opcional — ver abaixo |
| `descricao` | string | 🔧 sim | Nome do produto |
| `unidade` | string | 🔧 sim | Unidade de medida (`UND`, `KG`) |
| `codigo_produto_integracao` | string | 🔧 não | Sua chave de integração |
| `ncm` | string | 📖 não | Classificação fiscal |
| `valor_unitario` | number | 🔧 não | Preço de venda |
| `ean` | string | 🔧 não | Código de barras |
| `codigo_familia` | number | 🔧 não | ID da família |
| `tipoItem` | string | 📖 não | Código do tipo de item (`"04"` nos registros observados ✅) |
| `peso_liq` | number | 🔧 não | Peso líquido |
| `peso_bruto` | number | 🔧 não | Peso bruto |
| `marca` | string | 🔧 não | Marca |
| `modelo` | string | 🔧 não | Modelo |

`codigo_produto` também existe em `DadosProdutoParaGravar`, mas só faz sentido
no `AlterarProduto` — no `IncluirProduto` quem gera o ID é a Omie 🔧.

### `codigo` é obrigatório na prática

A doc pública da Omie trata `codigo` como opcional no `IncluirProduto`. O
comentário da interface registra o oposto, verificado contra a API real
(`produtos-gateway.ts:21-25`) 🔧. Enviar sem `codigo` falha.

Isso é armadilha recorrente e está repetido em [armadilhas.md](armadilhas.md).

## `AlterarProduto`

Recebe **chave + campos parciais**: o gateway monta o param como
`{ ...chave, ...dados }` (`produtos-omie-gateway.ts:81-85`) 🔧, onde `dados` é
`Partial<DadosProdutoParaGravar>`. Campos omitidos ficam como estavam 📖.

A chave é a mesma de `ConsultarProduto` — `codigo_produto`, `codigo` ou
`codigo_produto_integracao`, bastando um (`ChaveProduto`,
`produtos-gateway.ts:43-48`) 🔧.

```json
{
  "call": "AlterarProduto",
  "app_key": "SUA_APP_KEY",
  "app_secret": "SEU_APP_SECRET",
  "param": [{
    "codigo_produto": 9116171984,
    "valor_unitario": 18.5
  }]
}
```

Cuidado: `codigo` é obrigatório no `Incluir`, mas no `Alterar` ele é **campo
alterável** — mandar `codigo` diferente do atual junto com `codigo_produto`
renomeia o SKU, não seleciona outro produto 📖.

## `ExcluirProduto`

Recebe só uma `ChaveProduto` (`produtos-omie-gateway.ts:88-93`) 🔧.

```json
{
  "call": "ExcluirProduto",
  "app_key": "SUA_APP_KEY",
  "app_secret": "SEU_APP_SECRET",
  "param": [{ "codigo_produto": 9116171984 }]
}
```

**A exclusão falha para qualquer produto que já teve movimento de estoque**, e
o bloqueio é permanente — excluir o ajuste não devolve o direito de excluir o
produto. Detalhes em [armadilhas.md](armadilhas.md).

O campo `bloquear_exclusao` do cadastro (`"S"`/`"N"`, ✅ sempre presente na
listagem) é um bloqueio *manual*, independente desse bloqueio por movimento 📖.

## Resposta das três operações

Todas devolvem o mesmo formato, `StatusProdutoOmie`
(`produtos-gateway.ts:50-55`) 🔧:

| Campo | Tipo | Significado |
|---|---|---|
| `codigo_produto` | number | ID interno do produto afetado |
| `codigo_produto_integracao` | string | Chave de integração do produto |
| `codigo_status` | string | Código curto do resultado |
| `descricao_status` | string | Mensagem legível |

É o par código + descrição descrito em
[../glossario/campos.md](../glossario/campos.md) 🔧. Falha **não** vem por
status HTTP — vem como `faultstring` em HTTP 200, ver
[../convencoes/erros.md](../convencoes/erros.md).

## Próximo

- [armadilhas.md](armadilhas.md) — inclusive as duas armadilhas de escrita
- [leitura.md](leitura.md) — `Listar`/`Consultar`
