---
description: Explica como usar a skill omie-data (o que é, como configurar, quais comandos e filtros existem).
argument-hint: (nenhum argumento — este guia é sempre a versão completa)
---

Objetivo deste comando: ser o ponto de entrada de "como eu uso a skill
omie-data?" — tanto pra quem nunca usou quanto como lembrete rápido dos
filtros disponíveis.

Mostre um guia curto, nesta ordem:

1. **O que é**: a skill `omie-data` espelha localmente (SQLite, em
   `src/data/`) dados reais da Omie pra consulta rápida e
   offline, sem bater na API a cada pergunta. Hoje cobre o módulo de
   Produtos.

2. **Antes de usar, configure a credencial**: `/omie-data:configurar` pede
   App Key e App Secret da Omie, valida contra a API, e salva. Só precisa
   rodar uma vez (ou de novo se trocar de credencial).

3. **Os dois comandos disponíveis**, em uma tabela:

   | Comando | Uso |
   |---|---|
   | `/omie-data:configurar` | Configura (ou troca) a credencial da Omie. |
   | `/omie-data:produtos [pedido em texto livre]` | Consulta produtos no cache traduzido, aplicando filtros se o pedido indicar algum. Pergunta antes de buscar dado novo na Omie. |

4. **Filtros de `/omie-data:produtos`** — combinam entre si (AND). Explique
   com uma tabela e um exemplo de pedido em linguagem natural pra cada um:

   | Filtro | O que faz | Exemplo de pedido |
   |---|---|---|
   | busca | Nome ou código do produto | "produto arroz" |
   | categoria | Categoria/família do produto | "produtos de bebida" |
   | ativo | Só ativos ou só inativos | "produtos ativos" / "produtos descontinuados" |

   Se o pedido não deixar claro nenhum filtro, `/omie-data:produtos` pode
   rodar o CLI com `--ajuda` e oferecer os filtros como pergunta — não
   precisa que o usuário decore os nomes das flags, só descrever o que
   quer em português.

5. **Sobre o dado retornado**: cada consulta mostra a idade do cache (ex.:
   "coletado há 2 horas") e pergunta se o usuário quer usar como está ou
   atualizar antes de responder — isso evita bater na API da Omie sem
   necessidade.

6. **Módulos futuros**: por enquanto só Produtos. Estoque está planejado
   como uma coluna a mais em `view_produtos` (via join na Tradução), não
   como um comando novo — a forma de usar não muda quando chegar.

Não abra `docs/omie-data/` nem os ADRs pra responder este guia — aqueles
são referência de arquitetura pra quem desenvolve a skill, não pra quem só
quer usá-la.
