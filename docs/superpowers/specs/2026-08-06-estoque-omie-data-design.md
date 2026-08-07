# Módulo de Estoque no omie-data (enriquecer view_produtos)

Status: aprovado

## Contexto

O pacote `omie-data` implementa cache local (SQLite) de dados da Omie. Hoje só
existe o módulo Produtos, organizado por camada técnica (`application/`,
`domain/`, `infrastructure/`). O ADR 0002 estabelece que, quando o segundo
módulo (Estoque) chegar, a estrutura muda para `src/modules/<modulo>/` — e este
é exatamente esse momento.

O objetivo é que `view_produtos` passe a incluir quantidade e valor em estoque,
para responder perguntas como "quais produtos tenho e quanto vale meu estoque?"
— sem bater na API a cada consulta.

## Escopo

### Entra

1. **Reorganização estrutural** (commit 1): mover Produtos para
   `src/modules/produtos/`, split das interfaces HTTP em
   `IProdutosHttpClient` e `IEstoqueHttpClient`, ajustar todos os imports.
   Build + testes passando.

2. **Módulo de estoque** (commit 2):
   - Domínio: `PosicaoEstoque` (tipos crus da Omie)
   - Coleta: `collectEstoque` — varre todas as páginas de `ListarPosEstoque`
     e grava em `raw_estoque`
   - Tabela `raw_estoque`: `codigo_produto INTEGER, codigo_local_estoque
     INTEGER, payload_json TEXT, coletado_em TEXT, PRIMARY KEY
     (codigo_produto, codigo_local_estoque)`
   - `translateProdutos` alterado: faz join de `raw_produtos` com
     `raw_estoque` (soma quantidade e custo por produto), adiciona 3
     colunas em `view_produtos`: `quantidade_em_estoque REAL`,
     `valor_em_estoque_custo REAL`, `valor_em_estoque_venda REAL`
   - `rodarProdutos` alterado: coleta estoque (`collectEstoque`) antes da
     tradução, quando `atualizar=true`
   - `formatarResultadoProdutos` (cli.ts): tabela ganha coluna "Estoque"
   - Infra: `IOmieHttpClient` split em `IProdutosHttpClient` +
     `IEstoqueHttpClient`; `OmieHttpClientReal` e `FakeHttpClient`
     implementam ambas

### Não entra

- CLI independente de estoque (`omie-data estoque ...`)
- Menu de estoque no interativo
- Ajustes de estoque (incluir/excluir)
- `consultarEstoque()` separado — estoque só existe como coluna da view de
  produtos
- Alterações no servidor MCP (`src/modules/estoque/` — já existe lá, não
  mexemos)

## Design

### Estrutura final de diretórios

```
src/
  domain/                                   # compartilhado
    produtos-http-client.ts                 # IProdutosHttpClient
    estoque-http-client.ts                  # IEstoqueHttpClient
  application/                              # cross-module
    rodar-configurar.ts
    rodar-menu-principal.ts
  infrastructure/                           # compartilhado
    database.ts                             # + raw_estoque
    http-client-real.ts                     # implementa ambas interfaces
    fake-http-client.ts                     # implementa ambas interfaces
    caminhos.ts
    credenciais.ts
  modules/
    produtos/
      domain/produto.ts
      application/
        collect-produtos.ts
        translate-produtos.ts               # alterado: join com raw_estoque
        consultar-produtos.ts               # alterado: retorna novas colunas
        rodar-produtos.ts                   # alterado: coleta estoque antes
        rodar-ajuda-interativo.ts
    estoque/
      domain/estoque.ts                     # PosicaoEstoque
      application/
        collect-estoque.ts                  # coleta → raw_estoque
```

### Fluxo de dados

```
API Omie                              SQLite
───────                               ──────
ListarProdutos ──→ collect ──→ raw_produtos
                                           ↘
PosicaoEstoque ──→ collect ──→ raw_estoque ──→ translate ──→ view_produtos
                                                             (com qtd + custo + venda)
```

### Tabela `raw_estoque`

```sql
CREATE TABLE IF NOT EXISTS raw_estoque (
  codigo_produto INTEGER,
  codigo_local_estoque INTEGER,
  payload_json TEXT NOT NULL,
  coletado_em TEXT NOT NULL,
  PRIMARY KEY (codigo_produto, codigo_local_estoque)
);
```

PK composta porque a Omie devolve uma posição por produto por local de estoque
— o mesmo produto pode aparecer em múltiplos locais.

### Novas colunas em `view_produtos`

| Coluna | Tipo | Fonte |
|---|---|---|
| `quantidade_em_estoque` | REAL | Soma de `fisico` em todas as posições do produto |
| `valor_em_estoque_custo` | REAL | Soma de `fisico * nCMC` (custo médio) por posição |
| `valor_em_estoque_venda` | REAL | `quantidade_em_estoque * valor_unitario` do cadastro |

O join acontece na Tradução (`translateProdutos`), mantendo a regra do ADR
0001: Consulta nunca faz join, só lê da view já pronta.

### Interfaces HTTP (split)

**`IProdutosHttpClient`** (domain/produtos-http-client.ts):
```ts
listarProdutosPagina(pagina, registrosPorPagina): Promise<ListarProdutosResponseBruto>
```

**`IEstoqueHttpClient`** (domain/estoque-http-client.ts):
```ts
listarPosicoesEstoquePagina(pagina, registrosPorPagina): Promise<ListarPosEstoqueResponseBruto>
```

`OmieHttpClientReal` e `FakeHttpClient` implementam ambas — um objeto só pode
ser passado onde qualquer uma das interfaces é esperada (TypeScript structural
typing resolve).

### `collectEstoque`

Análogo ao `collectProdutos`: varre páginas de `ListarPosEstoque` (recurso
`estoque/consulta`), 100 registros por página, teto de 1000 páginas, 200ms de
espera entre páginas. Cada posição vira uma linha em `raw_estoque` (upsert por
`codigo_produto, codigo_local_estoque`).

### `translateProdutos` (alterado)

Passa a receber `db` e, além do loop atual, faz:

1. Lê `raw_estoque`, faz parse do JSON de cada linha
2. Agrupa por `codigo_produto`: soma `fisico`, soma `fisico * nCMC`
3. No upsert de `view_produtos`, adiciona as 3 colunas calculadas
4. Se não há posição de estoque pra um produto, as colunas ficam `0`

### `formatarResultadoProdutos` (cli.ts)

Tabela ganha coluna "Estoque" entre "Valor" e "Ativo", mostrando
`quantidade_em_estoque` formatada com 2 casas decimais + unidade.

### Fora de escopo (explícito)

- `valor_em_estoque_custo` e `valor_em_estoque_venda` **não** são exibidos na
  tabela formatada (só `quantidade_em_estoque`) — mas ficam disponíveis nas
  colunas da view e no `ProdutoView` para uso futuro (JSON, skill, etc.)
- Sem alteração no menu interativo (`rodar-ajuda-interativo` continua igual)
- Sem novo comando CLI para estoque

## Ordem de implementação

### Commit 1: Reorganização estrutural

Mover arquivos de Produtos para `src/modules/produtos/`, split das interfaces
HTTP, ajustar imports. Build + testes passando. Zero mudança de comportamento.

### Commit 2: Módulo de estoque

Adicionar `PosicaoEstoque`, `collectEstoque`, `raw_estoque`, enriquecer
`view_produtos` com 3 colunas, alterar `translateProdutos`, alterar
`rodarProdutos`, alterar `formatarResultadoProdutos`. Build + testes passando.
