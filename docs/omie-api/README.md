# API Omie — referência de chão de fábrica

Como obter os dados de cada endpoint da Omie, quais campos vêm de verdade, e
onde a API se comporta diferente do que documenta.

## Fronteira

Esta pasta documenta a **API da Omie**: protocolo, campos, comportamento.
[`docs/FERRAMENTAS.md`](../FERRAMENTAS.md) documenta as **ferramentas MCP**:
nome, argumentos, retorno. Não se sobrepõem — a doc da API nunca repete a
assinatura de uma tool.

[`docs/API.md`](../API.md) é o diário cronológico de achados ("em 21/07
descobrimos X"). Os arquivos `armadilhas.md` desta pasta são o estado atual
organizado por recurso, e linkam o diário como evidência.

## Marcação de confiança

Toda afirmação sobre comportamento da API carrega uma marca:

| Marca | Significa |
|---|---|
| ✅ | Observado ao vivo contra a conta real |
| 🔧 | Derivado do código que roda em produção (`src/modules/**`) |
| 📖 | Só da doc oficial da Omie — não verificado |

Nenhuma operação de escrita (`Incluir`/`Alterar`/`Excluir`) foi executada
contra a conta real. Tudo em `escrita.md` é `🔧` ou `📖`.

## Convenções (leia primeiro)

| Arquivo | Assunto |
|---|---|
| [request-auth.md](convencoes/request-auth.md) | Formato do POST, credenciais, base URL |
| [paginacao.md](convencoes/paginacao.md) | Os dois dialetos de paginação da Omie |
| [erros.md](convencoes/erros.md) | Erro em HTTP 200, rate limit, retry |
| [tipos-formatos.md](convencoes/tipos-formatos.md) | Datas, decimais, flags `"S"`/`"N"` |

## Glossário

| Arquivo | Assunto |
|---|---|
| [campos.md](glossario/campos.md) | Mesmo conceito, nome diferente por recurso |
| [conceitos.md](glossario/conceitos.md) | Malha, etapa, saldo físico × disponível |

## Recursos

| Recurso | Endpoint | Doc |
|---|---|---|
| Produtos | `geral/produtos` | [produtos/](produtos/README.md) |
| Estrutura (BOM) | `geral/malha` | [estrutura/](estrutura/README.md) |
| Estoque | `estoque/consulta`, `estoque/ajuste` | [estoque/](estoque/README.md) |
| Ordem de produção | `produtos/op` | [ordem-producao/](ordem-producao/README.md) |
| Pedido de venda | `produtos/pedido`, `produtos/etapafat` | [pedido-venda/](pedido-venda/README.md) |

## Integração

| Arquivo | Assunto |
|---|---|
| Modelo pro frontend | _(pendente — fase v3)_ |
| Gaps da camada própria | _(pendente — fase v3)_ |

## Escopo

**Cobre:** produtos, estrutura, estoque, ordem de produção, e a **leitura** de
pedido de venda — incluindo o catálogo de etapas de `produtos/etapafat`, que
serve os dois últimos.

**Não cobre:** emissão fiscal (NF-e, NFS-e), financeiro, compras, CRM,
serviços, e o CRUD de pedido de venda. Para esses, veja
[`docs/FERRAMENTAS.md`](../FERRAMENTAS.md).

## Manutenção

Mexeu num gateway de um dos cinco recursos, ou descobriu comportamento novo da
Omie? Atualize o arquivo correspondente **no mesmo commit**.

Antes de commitar:

```bash
pnpm run verificar-doc-omie
```

Checa links quebrados, arquivos acima de 200 linhas e células de tabela vazias.
