# omie-data

Skill que espelha localmente (SQLite) dados da Omie pra consulta rápida e offline, sem bater na API a cada pergunta.

## Language

**Dado Bruto** (tabelas `raw_*`, ex.: `raw_produtos`):
Cópia fiel do payload que a Omie devolveu para um recurso, indexada pela chave do recurso (ex.: `codigo_produto`). Uma linha por item, sem transformação — só o JSON como a API mandou, mais quando foi coletado.
_Avoid_: cache cru, dado original

**View** (tabelas `view_*`, ex.: `view_produtos`):
Tabela derivada de um ou mais Dados Brutos, já traduzida para nomes/valores legíveis e **já cruzada (join) com tudo que uma pergunta do usuário precisa numa resposta só**. Uma View representa uma pergunta que o usuário faz, não um recurso da Omie — por isso pode juntar mais de um Dado Bruto (ex.: `view_produtos` cruzando `raw_produtos` com `raw_estoque` por `codigo_produto`).
_Avoid_: view model, tabela final, tabela de leitura

**Coleta** (`collect*`, ex.: `collectProdutos`):
Processo que busca um recurso na API da Omie e grava/atualiza o Dado Bruto correspondente. Não transforma nada — só persiste o que voltou da API.
_Avoid_: sync, fetch, importação

**Tradução** (`translate*`, ex.: `translateProdutos`):
Processo que lê um ou mais Dados Brutos e (re)grava a View correspondente — formata valores, decide fallback pra campo ausente, e faz os joins entre Dados Brutos quando a View precisa de mais de uma fonte. Roda sem tocar a API — pode ser refeito a qualquer momento em cima do Dado Bruto já coletado.
_Avoid_: transform, processamento, ETL

**Consulta** (`consultar*`, ex.: `consultarProdutos`):
Leitura de uma View para responder ao usuário. Nunca lê Dado Bruto diretamente — se um dado que a Consulta precisa não está na View, a View está incompleta, não a Consulta.
_Avoid_: query, busca

## Regras de design

- **Uma View por pergunta do usuário, não uma View por recurso da Omie.** Se responder "quais produtos tenho" exige nome + preço + estoque, esses três vêm de uma `view_produtos` só (mesmo que estoque venha de um Dado Bruto separado), não de três Views que o usuário/CLI precisaria cruzar na mão.
- **O join acontece na Tradução, nunca na Consulta.** A Consulta é sempre um `SELECT` simples numa única View.
- `quantidade_estoque` do payload de `ListarProdutos`/`ConsultarProduto` da Omie sempre vem `0` nesta conta — não é fonte confiável de estoque. Precisa vir de um Dado Bruto de estoque separado (recurso próprio da Omie), nunca de coluna dentro do payload de produto.
