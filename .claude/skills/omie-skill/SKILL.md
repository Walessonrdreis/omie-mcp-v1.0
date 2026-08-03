---
name: omie-skill
description: Referência cacheada e organizada por módulo das ferramentas do servidor MCP omie-mcp (ERP Omie — produtos, estoque, ordens de produção, pedidos de venda, financeiro, CRM, NF-e, compras, PIX, serviços, etc.). Use esta skill sempre que for chamar uma ferramenta `omie_*`, decidir qual ferramenta/módulo usar pra uma tarefa na Omie, ou precisar saber os parâmetros exigidos por uma tool — mesmo que o usuário não diga "skill" ou "omie-skill" explicitamente, basta mencionar Omie, ERP, ordem de produção, estoque, pedido de venda, NF-e, contas a pagar/receber, ou qualquer operação que bata em `omie_*`. NÃO leia `docs/FERRAMENTAS.md` inteiro nem regenere o cache desta skill como parte de responder uma pergunta normal — isso é o problema que a skill existe pra evitar.
---

# omie-skill — referência cacheada das ferramentas do omie-mcp

Este projeto (`omie-mcp`) expõe ~116 ferramentas MCP (`omie_*`) pra operar o
ERP Omie. A referência completa de todas elas junto (`docs/FERRAMENTAS.md`)
tem mais de 1500 linhas — carregar o arquivo inteiro pra responder "qual o
parâmetro de `omie_op_incluir`?" desperdiça uma quantidade grande de tokens
de contexto à toa. Esta skill (`omie-skill`) resolve isso com um **cache
pré-gerado, quebrado por módulo**, em `cache/`: você abre só o(s) arquivo(s)
do(s) módulo(s) relevante(s) pra pergunta atual.

## Como usar (fluxo automático da skill)

1. Abra `cache/_index.md` — uma tabela com os 21 módulos (nome, quantidade
   de ferramentas, arquivo, resumo de uma linha). Isso é suficiente pra
   descobrir qual módulo cobre a tarefa (ex: "criar ordem de produção" →
   módulo "Ordem de Produção" → `cache/ordem-de-producao.md`).
2. Leia **só** o(s) arquivo(s) de módulo indicado(s) — cada um lista as
   ferramentas daquele módulo com descrição, parâmetros (nome/tipo/
   obrigatório) e se é destrutiva. Isso já basta pra montar a chamada da
   tool na maioria dos casos.
3. Se a tarefa não bater com nenhum módulo específico, considere a
   ferramenta genérica `omie_chamar_api` (`cache/generica.md`), que chama
   qualquer endpoint da Omie por `resource`/`call` — útil pra métodos que
   ainda não têm tool dedicada.
4. Se o cache não responder a dúvida (ex: você precisa do JSON Schema
   completo, de exemplos de resposta, ou de notas de arquitetura de um
   módulo), aí sim vale abrir `docs/FERRAMENTAS.md` (mesma fonte, versão
   completa) ou `README.md`/`FUNCIONALIDADES.md` — mas isso é exceção, não
   o caminho padrão.

## Comandos de terminal (`/omie-skill:*`)

Além de ativar sozinha quando a tarefa pede, a skill expõe comandos pra
invocar direto no chat (`.claude/commands/omie-skill/`):

| Comando | O que faz |
|---|---|
| `/omie-skill:guia` | Mostra o índice de módulos (`cache/_index.md`) e, se o pedido já indicar um módulo/operação, abre o arquivo correspondente e resume as ferramentas. Ponto de entrada rápido, sem precisar que a skill dispare sozinha. |
| `/omie-skill:atualizar-cache` | Roda `npm run skill-cache` (recompila e regenera `cache/*.md` + `manifest.json` a partir do registro atual de ferramentas) e resume o que mudou. |
| `/omie-skill:verificar-cache` | Roda `npm run skill-cache:check` — só diz se o cache está desatualizado, sem regenerar nada. |

Os mesmos comandos existem como scripts npm (ver seção abaixo) pra quem
preferir rodar fora do chat.

## Atualizando o cache (só por comando, nunca automático)

O cache é gerado por `scripts/gerar-skill-cache.mjs` a partir do registro
real de ferramentas (`src/tools/registry.ts` + módulos em `src/modules/`) —
a mesma fonte de `docs/FERRAMENTAS.md`. Ele **não** se atualiza sozinho: só
regenere quando:

- o usuário pedir explicitamente pra atualizar/refrescar o cache (`/omie-skill:atualizar-cache` ou diretamente);
- você acabou de adicionar, remover ou alterar uma ferramenta (novo módulo,
  novo parâmetro, descrição mudou) e precisa que a skill reflita isso.

Comandos (raiz do projeto):

```bash
npm run skill-cache:check   # só verifica se o cache está desatualizado (não escreve nada, barato)
npm run skill-cache         # regenera cache/*.md + manifest.json a partir do registro atual
```

`skill-cache:check` compara um hash do registro atual (nome, descrição,
schema, destructive/cacheable de cada tool) contra o hash salvo em
`cache/manifest.json` na última geração — dá pra saber se está desatualizado
sem reescrever nada. Rode esse antes de decidir se vale regenerar. Evite
rodar `npm run skill-cache` (que recompila o projeto) como parte de uma
consulta comum — o objetivo da skill é justamente evitar esse custo repetido.

Não edite os arquivos dentro de `cache/` à mão — eles são sobrescritos na
próxima geração.

## Coisas importantes que valem pra qualquer ferramenta (não repetidas em cada módulo)

- Ferramentas marcadas **⚠️ destrutiva** incluem, alteram ou excluem dado
  real na Omie. Confirme com o usuário antes de chamar, e se for via API
  HTTP local (`src/httpServer.ts`), lembre do `"confirmar": true` no
  payload (ver `docs/SEGURANCA.md`).
- Ferramentas marcadas **cacheável (servidor)** usam um cache de resposta
  com TTL do próprio servidor MCP (`src/shared/cache.ts`, `OMIE_CACHE_TTL_MS`)
  — isso é cache de dado da API Omie em runtime, **diferente** deste cache
  de referência da skill (que é sobre a documentação das ferramentas, não
  sobre os dados que elas retornam).
- Vários campos que a documentação pública da Omie marca como opcionais são,
  na prática, obrigatórios (ex: `codigo_local_estoque` em OP). Quando o
  arquivo de módulo mencionar isso na descrição da tool, confie nele — foi
  testado ao vivo contra a API.
