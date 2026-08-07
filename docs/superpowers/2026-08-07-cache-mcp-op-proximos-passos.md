# Cache compartilhado MCP + skill — o que ficou pra depois

Documento gerado ao final da execução dos planos
`2026-08-07-pnpm-workspace-cleanup.md` e `2026-08-07-cache-mcp-op.md`.
Registra o que a revisão final de branch recomendou, os achados aceitos
conscientemente e as decisões tomadas — para não se perderem junto com o
workspace de scratch do processo.

## O que foi entregue

Ordem de Produção virou o primeiro módulo do servidor MCP a ler de um cache
local em vez de bater ao vivo na Omie:

- Módulo completo em `packages/omie-data`, no padrão Dado Bruto → Coleta →
  Tradução → View → Consulta.
- `omie_op_atualizar_cache` (nova) e `omie_op_listar_com_produto` (migrada de
  ao vivo para o cache, com contrato de saída preservado e `geradoEm`/`idadeMs`
  aditivos).
- Verificado ao vivo: 1616 OPs coletadas, `atualizadoEm` idêntico ao `geradoEm`
  devolvido em seguida, paginação estável, 87 OPs não concluídas.
- **A tese do plano está provada:** o arquivo `~/.omie-data/<hash>.db` contém
  simultaneamente `raw_produtos` (1991 linhas, escritas pelo CLI/skill) e
  `raw_ordens_producao` (1616 linhas, escritas pelo MCP). Os dois sistemas
  compartilham o mesmo cache de fato.

## Fazer ANTES de replicar o padrão

O plano é prova de conceito para Pedidos, Estrutura/BOM e Movimentações de
Estoque virem depois. Estes itens ficam mais caros a cada módulo replicado.

### 1. Extrair as três duplicações de uma vez

Hoje existem três cópias quase verbatim de cada um destes blocos:

- o laço de paginação, em `collect-op.ts` / `collect-produtos.ts` /
  `collect-estoque.ts` → extrair um `coletarPaginado` genérico;
- o bloco retry + parse + `faultstring`, nos três métodos de
  `http-client-real.ts` → extrair um `chamarOmie(endpoint, call, param)`;
- a paginação e filtragem no `execute` da ferramenta MCP → extrair um
  `paginarEFiltrar<T>` ou um `ListarDoCacheUseCase`.

O terceiro é o que a revisão final classificou como **Important** e que ficou
adiado: a lógica que saiu do use-case removido (que tinha 3 testes) está hoje
no `execute` de `ordem-producao-tools.ts` sem teste nenhum. O contrato de saída
está amarrado pelo compilador, mas o compilador não pega
`inicio = pagina * registrosPorPagina` no lugar de `(pagina - 1) * ...`.

Feito agora custa uma task. No quarto módulo, custa seis reescritas em código
de produção com testes fracos.

### 2. `pagina` sem teto

`omie_op_listar_com_produto` ganhou piso (`.int().positive()`) mas não teto:
uma página além de `totalPaginas` devolve `itens: []` com `totalRegistros`
cheio. Um modelo consumidor lê isso como "não há OPs". É o menor com maior
chance de virar resposta errada ao usuário final, e a correção é de uma linha.

### 3. Datas como texto `DD/MM/AAAA`

As colunas `data_*` de `view_ordens_producao` são texto no formato brasileiro.
Consequências:

- não ordenam corretamente em SQL;
- `bateCriterio` (`src/shared/filtro.ts`) faz `Number(valorCampo)` nos
  operadores `maior_que` / `menor_que` / `entre`, o que dá `NaN` e portanto
  **sempre false**.

Ou seja: um filtro de período ("OPs atrasadas", "desta semana") devolve lista
vazia **silenciosamente** — não resultado errado, mas também não um erro. E a
`description` da ferramenta anuncia o filtro genérico "sobre QUALQUER campo",
o que convida o modelo a tentar. Guardar ISO na view resolve.

Não é regressão: o comportamento era idêntico antes da migração.

### 4. Consistência do cache — três ângulos do mesmo problema

Decidir juntos, porque são a mesma questão:

- **Poda de linhas órfãs.** `translateOrdemProducao` faz upsert sem `DELETE`
  prévio, e `raw_ordens_producao` nunca é podada. Uma OP excluída na Omie
  sobrevive na view indefinidamente, sem sinal de que é fantasma. A correção
  certa não é `DELETE FROM view` — é podar o Dado Bruto
  (`DELETE FROM raw_ordens_producao WHERE codigo_op NOT IN (<vistos nesta passada>)`),
  o que exige a Coleta devolver os códigos vistos.
- **Transações.** Nem a Coleta nem a Tradução são transacionais. Uma coleta que
  falha na página 9 deixa páginas 1-8 com carimbo novo e 9-16 com o antigo; a
  Tradução regrava tudo com um único `gerado_em`, e a view fica com dado de duas
  idades sob um carimbo só. Hoje isso é mitigado por uma mensagem de erro
  explícita ("o cache pode estar PARCIALMENTE atualizado, rode de novo").
- **`MIN` vs `MAX` de `gerado_em`.** A consulta reporta a idade do cache usando
  o timestamp mais **novo**. `MIN` responderia "nenhum dado aqui é mais velho
  que isso", que é a garantia que um aviso de frescor precisa dar. Errar para
  "mais velho do que é" faz o usuário reconsultar; errar para "mais novo do que
  é" faz ele confiar em número errado. Trocar nos dois módulos juntos (OP e
  Produtos), para não divergirem.

### 5. Documentar a lição do cliente HTTP no `CONTEXT.md`

**Este foi o achado mais valioso da execução.** Ao implementar
`listarOrdensProducaoPagina`, seguir apenas o gateway do módulo teria produzido
payload errado:

- `src/modules/ordemProducao/infrastructure/gateways/op-omie-gateway.ts` escreve
  `param` como **objeto**;
- o embrulho em **array** acontece só em `src/integrations/omie/omieClient.ts`
  (`param: [options.param ?? {}]`).

Ou seja, o gateway sozinho engana. A regra existente ("confira contra um gateway
já validado em produção") precisa virar: **a lista de fontes obrigatórias para
qualquer cliente HTTP novo inclui `src/integrations/omie/omieClient.ts`, não só
o gateway do módulo.** Escrever isso em `packages/omie-data/CONTEXT.md`.

Contexto: essa classe de erro já causou um bug de produção (HTTP 500) no módulo
de Estoque.

### 6. Rate limit é contado por credencial, não por processo

O tratamento de rate limit foi acrescentado **apenas** no caminho de Ordem de
Produção (decisão consciente: mexer em Produtos e Estoque, que já estão em
produção e têm testes de paginação fracos, era risco de regressão silenciosa).

Consequência não óbvia: a Omie conta rate limit **por credencial**. Um
`omie_op_atualizar_cache` e uma coleta de Produtos pelo CLI rodando ao mesmo
tempo competem pela mesma cota. O caminho de OP aguenta o "consumo indevido";
o de Produtos aborta. **Quem quebra primeiro é o CLI, não o MCP**, e o sintoma
aparece longe da mudança.

## Achados aceitos conscientemente

Nenhum bloqueia merge. Registrados para não serem "redescobertos" depois.

- **Teste de concorrência vacuamente verde.** `database.test.ts` tem um teste
  "leitor lê durante escrita" cujo comentário afirma que sem WAL a leitura
  estouraria `SQLITE_BUSY`. **Isso é factualmente errado** — o cenário passa
  igual com `journal_mode = DELETE`, porque um escritor em `BEGIN IMMEDIATE`
  segura apenas RESERVED, que não bloqueia leitores. O pragma WAL em si está
  correto e coberto por um teste dedicado de `journal_mode`; o defeito é falsa
  confiança. Corrigir o comentário ou refazer o teste (exigiria o escritor num
  COMMIT em andamento, ou um segundo escritor).
- `db.close()` fora de `try/finally` no branch mock de `omie_op_atualizar_cache`.
  Nada entre a abertura e o close pode lançar; destoa do padrão do arquivo.
- As fixtures de `op-cache-mock.ts` duplicam manualmente os dados de
  `OpFakeGateway` em vez de reaproveitá-los — vão divergir em silêncio.
- `op-cache-mock.ts` e seu teste ficaram em 80 colunas; o repo usa ~100 e não
  tem `.prettierrc`. Um `.prettierrc` com `printWidth: 100` resolve de vez.
- Coerção numérica ausente em `nQtde` na Tradução (`translateProdutos` usa
  `Number(x) || 0` por causa de um bug real com posição de estoque malformada).
- Erro de HTTP não-ok descarta o corpo da resposta; a raiz inclui
  `text.slice(0, 500)`, que é onde costuma estar a causa real.
- `MAX_TENTATIVAS` é 3 no pacote e 4 na raiz; backoff fixo de 500ms contra
  `attempt * 500` na raiz.
- As demais ferramentas de listagem do repo seguem com `z.number().optional()`
  cru na paginação — mesma classe de problema que foi corrigida em
  `omie_op_listar_com_produto`.

## Decisões tomadas nesta execução

- **Duplicação dos coletores:** o plano governa; a cópia fica e a extração vira
  task futura (item 1 acima).
- **Leitura da idade do cache:** o plano governa; mantido o `gerado_em` mais
  novo, com a troca para `MIN` registrada como pendente para os dois módulos
  (item 4).
- **`atualizadoEm`:** corrigido contra o texto do plano. A ferramenta passou a
  devolver o mesmo `gerado_em` que o consumidor lerá, em vez de carimbar um
  relógio novo — que anunciava o dado como mais fresco do que a linha mais
  antiga realmente era.
- **Rate limit:** corrigido apenas no caminho de OP (item 6).
- **`OMIE_MOCK`:** as duas ferramentas novas passaram a honrar a convenção do
  repo, montando o cache em `:memory:` a partir do `FakeHttpClient` — sem rede,
  sem credencial e sem escrever no cache em disco.
- **Ambiente pnpm:** o diagnóstico original do plano 1 (mistura npm/pnpm) estava
  errado. A causa real era o lockfile resolvendo `vite@5.4.21` para
  `vitest@4.1.10`, que exige `^6 || ^7 || ^8`, com `vite` não declarado em lugar
  nenhum. Registrado em `docs/CONTEXTO-SESSOES.md`.

## Fora de escopo, como o plano já previa

Skill/CLI do `omie-data` ganhar comandos de OP; sync incremental; TTL
automático; divisão do banco em um arquivo por módulo; migrar Produtos e
Estoque para o servidor MCP; e os outros módulos do Chão de Fábrica.
