# Cache compartilhado entre MCP e skill — prova de conceito em Ordem de Produção

Status: aprovado

## Contexto

Hoje existem dois sistemas desconectados neste repo pra falar com a Omie:

1. **Servidor MCP** (`src/`, raiz do repo) — ~110 ferramentas `omie_*` em 19
   módulos, todas batendo ao vivo na API da Omie a cada chamada. Rápido de
   implementar por módulo, mas cada pergunta repetida custa uma chamada de
   API nova — sem cache, sem histórico, sem noção de "dado já visto".
2. **`omie-data`** (`packages/omie-data/`) — cache local em SQLite, hoje
   cobrindo Produtos e Estoque, seguindo o padrão Dado Bruto → Coleta →
   Tradução → View → Consulta (ver `packages/omie-data/CONTEXT.md`).
   Acessível só via CLI/slash-commands, desconectado do servidor MCP.

Isso gerou duplicação de esforço e de conceito: o servidor MCP já tem um
use-case (`ListarOpsComProdutoUseCase`) que recalcula, a cada chamada, o
mesmo enriquecimento (OP + nome/SKU do produto) que o `omie-data` faria uma
vez só e serviria do cache. Construir uma cobertura completa de OP (e depois
Pedidos, Estrutura, Movimentações de Estoque) primeiro no MCP e depois na
skill, sem repetir esse trabalho duas vezes, exige que os dois sistemas
compartilhem a mesma camada de dados.

Esta spec cobre a prova de conceito desse compartilhamento: o servidor MCP
passa a consumir o `omie-data` como biblioteca, e o primeiro módulo migrado
de ponta a ponta é **Ordem de Produção**. Produtos e Estoque, que só existem
no `omie-data` hoje, ficam de fora desta spec (migração deles pro servidor
MCP é trabalho futuro, mesmo padrão, spec própria).

## Escopo

### Entra

1. **Workspace npm** ligando o servidor raiz ao `packages/omie-data` como
   dependência real (hoje são pacotes irmãos sem relação declarada).
2. **Módulo de Ordem de Produção no `omie-data`**, seguindo o padrão já
   estabelecido por Produtos/Estoque:
   - Domínio: `OrdemProducaoOmieBruta` — tipo cru espelhando exatamente
     `src/modules/ordemProducao/domain/interfaces/op-gateway.ts` (fonte de
     verdade dos nomes de campo — ver seção "Erros e proteções").
   - `IOrdemProducaoHttpClient` (interface HTTP própria, como
     `IProdutosHttpClient`/`IEstoqueHttpClient`), implementada por
     `OmieHttpClientReal` e `FakeHttpClient`.
   - `raw_ordens_producao`: tabela de Dado Bruto (payload cru + timestamp de
     coleta).
   - `collectOrdemProducao`: varre `ListarOrdemProducao`, grava/atualiza
     `raw_ordens_producao`. Nunca traduz.
   - `translateOrdemProducao`: lê `raw_ordens_producao` + `raw_produtos`,
     grava `view_ordens_producao` já com nome/SKU do produto (mesmo
     enriquecimento que `ListarOpsComProdutoUseCase` faz hoje ao vivo, mas
     persistido). Nunca chama rede.
   - `consultarOrdensProducao`: `SELECT` simples em `view_ordens_producao`,
     com filtros. Nunca lê Dado Bruto diretamente.
3. **Duas ferramentas MCP** (`src/modules/ordemProducao/presentation/mcp/`):
   - `omie_op_atualizar_cache` — chama `collectOrdemProducao` +
     `translateOrdemProducao`, devolve total de OPs coletadas e o timestamp
     da coleta. Sem parâmetro obrigatório.
   - `omie_op_listar_com_produto` (existente) — **muda de fonte**: passa a
     ler de `view_ordens_producao` via `consultarOrdensProducao`, em vez de
     bater na Omie a cada chamada. Resposta inclui `coletadoEm` (idade do
     dado). Mesma assinatura de filtros que já tem hoje
     (`apenas_nao_concluidas`, `filtros` genéricos, paginação) — sem quebrar
     contrato pra quem já usa a ferramenta.
4. Banco usado: o mesmo `~/.omie-data/<hash-da-credencial>.db` que o
   `omie-data` já usa — um arquivo só, tabelas separadas por módulo (como já
   é hoje). Dado acessível tanto pelo CLI do `omie-data` quanto pelas
   ferramentas MCP.

### Não entra

- Ferramentas de escrita de OP (`omie_op_incluir`, `omie_op_alterar`,
  `omie_op_excluir`, `omie_op_consultar` por chave única) continuam ao vivo,
  sem cache — escrever contra um cache é incorreto por natureza.
- Skill/CLI do `omie-data` ganhar comandos de OP (`omie-data op ...`,
  `/omie-data:op`) — fica pra depois que o lado MCP estiver validado.
- Sync incremental (buscar só o que mudou desde a última coleta) — visão de
  futuro, registrada aqui mas não implementada. Fica mais fácil de encaixar
  depois se `raw_ordens_producao` já guardar `coletado_em` por linha (já
  guarda, por causa do padrão existente).
- Atualização automática por TTL (cache expirar sozinho) — MVP é cache
  sempre servido do que existe, atualização só quando `omie_op_atualizar_cache`
  for chamada explicitamente.
- Divisão do banco em um arquivo `.db` por módulo — mantém um arquivo só por
  enquanto (decisão registrada em 2026-08-07: revisitar quando o volume de
  dado justificar).
- Migrar Produtos/Estoque (que já existem só no `omie-data`) pro servidor
  MCP — módulo por módulo, cada um vira spec própria reaproveitando este
  padrão.
- Os outros módulos do Chão de Fábrica (Pedidos, Estrutura/BOM,
  Movimentações de Estoque) — cada um é uma spec+plano futuro, seguindo o
  padrão que esta spec estabelece.

## Design

### Estrutura de diretórios (novo, dentro de `packages/omie-data/src/`)

```
domain/
  ordem-producao-http-client.ts       # IOrdemProducaoHttpClient
modules/
  ordemProducao/
    domain/ordem-producao.ts          # OrdemProducaoOmieBruta
    application/
      collect-op.ts
      translate-op.ts
      consultar-op.ts
```

`infrastructure/database.ts` ganha `raw_ordens_producao` + `view_ordens_producao`.
`infrastructure/http-client-real.ts` e `infrastructure/fake-http-client.ts`
passam a implementar `IOrdemProducaoHttpClient` também (mesmo padrão que já
fazem para `IProdutosHttpClient`/`IEstoqueHttpClient`).

### Schema

```sql
CREATE TABLE IF NOT EXISTS raw_ordens_producao (
  codigo_op INTEGER PRIMARY KEY,
  payload_json TEXT NOT NULL,
  coletado_em TEXT NOT NULL
);
```

`view_ordens_producao` (colunas exatas a definir na Tradução, mas cobrindo no
mínimo): `codigo_op`, `numero_op`, `codigo_produto`, `codigo_sku`,
`descricao_produto`, `quantidade`, `data_previsao`, `data_inicio`,
`data_conclusao`, `concluida` (boolean), `etapa_codigo`.

### Fluxo de dados

```
omie_op_atualizar_cache
  → collectOrdemProducao(db, client)   # grava raw_ordens_producao
  → translateOrdemProducao(db)         # join com raw_produtos → view_ordens_producao
  → { totalColetado, coletadoEm }

omie_op_listar_com_produto(filtros)
  → consultarOrdensProducao(db, filtros)  # SELECT simples na view
  → { itens, coletadoEm }
```

Se `view_ordens_producao` estiver vazia (nunca coletado), `consultarOrdensProducao`
devolve uma resposta explícita indicando isso — nunca uma lista vazia
silenciosa, pra não parecer "não tem OP nenhuma" quando na verdade é "nunca
coletei".

### Erros e proteções

- **Antes de implementar `IOrdemProducaoHttpClient`**, os nomes de campo e o
  formato exato de requisição/resposta devem ser confirmados contra
  `src/modules/ordemProducao/infrastructure/gateways/op-omie-gateway.ts`
  (gateway já validado em produção) — nunca inventados a partir de doc
  pública ou por analogia. Esta é a mesma causa raiz do bug de HTTP 500 que
  o módulo de Estoque teve (nomes de campo inventados na requisição) — vira
  regra explícita no plano de implementação, checada na revisão de cada
  task relevante.
- `collectOrdemProducao` reaproveita o padrão de retry já usado em
  `collectProdutos`/`collectEstoque` (retentar em 5xx, desistir em 4xx).
- `translateOrdemProducao` nunca chama rede — só lê Dado Bruto e escreve a
  View, podendo ser refeita a qualquer momento sem custo de API.

### Testes

TDD seguindo o padrão já estabelecido no módulo de Estoque como referência
direta: `collect-op.test.ts`, `translate-op.test.ts`, `consultar-op.test.ts`,
teste do método novo em `http-client-real.test.ts` (URL, payload, resposta,
faultstring, retry em 5xx). Testes de integração das duas ferramentas MCP
novas/alteradas dentro do servidor raiz.

## Decisões registradas nesta sessão

- Prioridade: cache funcionando **dentro do MCP primeiro**; skill/CLI do
  `omie-data` pra OP vem depois, reaproveitando o mesmo cache.
- `packages/omie-data` vira a camada de dados compartilhada (Abordagem A —
  workspace npm), não um pacote novo separado (Abordagem B) nem lógica
  duplicada no servidor raiz (Abordagem C) — decisão pra não gerar trabalho
  de refatoração adiantado; migrar pra um pacote extraído fica mais fácil
  depois, com código real rodando guiando a extração.
- Banco único (não dividido por módulo) por enquanto — revisitar quando o
  volume justificar.
- MVP de atualização: cache sempre servido do que existe, atualização só via
  ferramenta dedicada por módulo (`omie_<modulo>_atualizar_cache`) — sem TTL
  automático nem sync incremental por enquanto.
