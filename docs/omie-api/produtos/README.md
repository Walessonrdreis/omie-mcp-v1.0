# Produtos — `geral/produtos`

O cadastro de produtos da Omie. É a entrada da cadeia de chão de fábrica:
tudo em estrutura, estoque e ordem de produção referencia um `codigo_produto`
daqui.

← [Índice](../README.md)

**Não** é fonte de saldo de estoque, apesar de expor `quantidade_estoque` —
ver [armadilhas.md](armadilhas.md).

## Métodos

| Método | O que faz | Doc |
|---|---|---|
| `ListarProdutos` | Página do catálogo, dialeto snake | [leitura.md](leitura.md) |
| `ConsultarProduto` | Um produto por chave, com campos extras | [leitura.md](leitura.md) |
| `IncluirProduto` | Cria produto — `codigo` obrigatório na prática | [escrita.md](escrita.md) |
| `AlterarProduto` | Chave + campos parciais | [escrita.md](escrita.md) |
| `ExcluirProduto` | Só chave; bloqueada após movimento de estoque | [escrita.md](escrita.md) |

Nenhum método de escrita foi executado contra a conta real — ver o aviso em
[escrita.md](escrita.md).

## Arquivos

| Arquivo | Assunto |
|---|---|
| [leitura.md](leitura.md) | Parâmetros, requests, paginação, chave alternativa |
| [campos.md](campos.md) | Todos os campos da resposta e o que cada um significa |
| [escrita.md](escrita.md) | `Incluir`/`Alterar`/`Excluir`, derivados do código |
| [armadilhas.md](armadilhas.md) | As sete armadilhas do recurso |

## O essencial em cinco linhas

1. `codigo_produto` é o ID da Omie; `codigo` é o seu SKU ✅.
2. `quantidade_estoque` sempre vem `0` — cruze com `estoque/consulta` ✅.
3. Envie `apenas_importado_api: "N"` e `filtrar_apenas_omiepdv: "N"`; omitir
   reduz o catálogo e zera o fiscal ✅.
4. `ConsultarProduto` traz mais campos que `ListarProdutos`, mas custa uma
   chamada por produto — não há consulta em lote ✅.
5. Produto que já teve ajuste de estoque nunca mais pode ser excluído 🔧.

## Relacionados

- [../convencoes/paginacao.md](../convencoes/paginacao.md) — o dialeto snake
- [../glossario/campos.md](../glossario/campos.md) — tradução para os outros
  recursos
- `estrutura/README.md` (fase v1) — quem consome esses produtos como componente
