# Prompt reutilizável: planejar TODO o labarr-api antes de implementar

Cole este prompt no início de uma nova sessão quando quiser continuar o
planejamento do **labarr-api** (a nova API de domínio + integração Omie do
SPA Labarr — fábrica de chocolate) cobrindo TUDO que falta — F2 (estoque),
F3 (OPs com submit separado), sheets-export e deploy — e só depois decidir
onde executar (repo novo `labarr-api` ou branch). O objetivo desta sessão é
**planejar até cobrir tudo que é preciso, sem implementar nada**. A sessão
roda no repo omie-mcp (é onde ficam os docs); a execução, quando vier, vai
para o repo/branch que você decidir no final.

---

## Prompt

```
Vamos continuar o planejamento do labarr-api (a nova API de domínio +
integração Omie do SPA Labarr). Objetivo desta sessão: **planejar TUDO
primeiro, até cobrir tudo que é preciso**, e só depois decidir onde
executar (repo novo `labarr-api` ou branch). NÃO implemente nada, NÃO crie
repo, NÃO crie branch nesta sessão — só planejar.

## Ponto de partida (ler antes de tudo)

1. Spec aprovada: `docs/superpowers/specs/2026-08-05-labarr-api-design.md`
   — decisões 1–11 travadas: repo novo `apps/api` modular; API de domínio
   ≠ Sheets (Sheets vira só destino de export); store = Postgres; ADR de
   hospedagem EM ABERTO pra decidir em F0; protocolo Omie COPIADO do
   omie-mcp, nunca importado; fases F0–F3; separação de submit na Fase 3;
   SPA ganha rotas novas sem tocar no GAS.
2. Plano F0–F1 já escrito: `docs/superpowers/plans/2026-08-05-labarr-api-f0-f1.md`
   — 15 tasks TDD completas (scaffold, ADR-0001 hospedagem, auth, envelope/
   erros/concurrency, store+migrations, action-router+server, OmieClient
   port, catálogo, rota `/catalogo-omie` no SPA, backup/deploy). Está pronto
   pra executar — revise e mantenha, não reescreva sem motivo.

## Achados empíricos já confirmados (não re-descobrir)

- `ListarProdutosResponse` traz os produtos em `produto_servico_cadastro`
  (NÃO `produto_lista`), além de `registros`.
- `quantidade_estoque` vem SEMPRE 0 — nunca usar; estoque real vem de
  `estoque/movestoque` (F2).
- SPA `apiFetch` lê sessionToken SÓ de `localStorage.getItem('gas_session')`
  → rota nova precisa de chave própria (`labarr_api_session`) via
  `callOptions.sessionKey`/`sessionToken`.
- Regras do transporte Omie (copiar verbatim em `integrations/omie/`):
  throttle 300ms, retry "aguarde N segundos", máx 5 conc., envelope
  `{success,data}` / `{success,error}` sempre HTTP 200, faultstring
  verificado mesmo em HTTP 200.
- Estilo do novo repo: aspas duplas + ponto e vírgula (código portado do
  omie-mcp). SPA: aspas simples, sem ponto e vírgula.

## Fluxo desta sessão (planejamento apenas)

1. Leia a spec e o plano F0–F1 acima.
2. Faça brainstorming dos pontos que a spec NÃO fecha em nível de
   implementação (uma pergunta por vez, 2-4 opções quando fizer sentido):
   - F2 estoque: agregação de `estoque/movestoque` — quais saldos mostrar,
     periodicidade, como trata "falhou vs não existe".
   - F3 OPs: separação de submit — campos que a Omie obriga, como o módulo
     `mapeamentos` extrai o subconjunto, regra de reprocessamento
     (sync-incremental), idempotência por `correlationId`.
   - sheets-export: o que exportar (espelho PRODUTOS_OMIE, relatórios),
     gatilho (endpoint protegido e/ou cron).
   - ADR-0001 hospedagem: opção B (VPS própria + Supabase) é a preferida;
     backup automatizado do Postgres é NÃO-negociável nessa opção.
3. Escreva/atualize as specs necessárias em
   `docs/superpowers/specs/YYYY-MM-DD-<topico>-design.md` e commite.
4. superpowers:writing-plans — escreva os planos que faltam (F2, F3,
   sheets-export, deploy), mesmas regras: tasks pequenas TDD (teste que
   falha → confirma falha → implementa → confirma passa → commit), código
   completo sem placeholders, self-review ao final de cada plano. Salve em
   `docs/superpowers/plans/YYYY-MM-DD-<topico>.md`.
5. Ao final, apresente o MAPA DE COBERTURA: lista de todas as fases/planos,
   o que cada um cobre e o que ainda falta. Se faltar algo, continue
   planejando até eu confirmar que "cobriu tudo que é preciso".

## Próxima etapa (NÃO fazer agora, só decidir depois)

Quando o planejamento estiver completo e aprovado, decidir ONDE executar:
- repo novo `C:\Users\Dell\Projects\labarr-api` (decisão 1 da spec, padrão
  `apps/api`), ou
- branch no repo atual.

Confirmar comigo antes de qualquer criação. A execução em si é outra
sessão (subagent-driven-development) — não começar aqui.

Preferências de processo já estabelecidas:
- Superpowers é a primeira opção de workflow, não fallback.
- TDD sempre; testes colocados junto do arquivo que testam (nunca pasta
  `tests/` separada).
- Um commit por mudança coerente (uma task do plano, ou um ajuste pontual),
  mensagem explicando o "porquê".
- Sem scope creep: pedido fora do escopo do plano atual vira task/decisão
  separada, ou pergunta antes de misturar.
- Segurança do servidor/CORS: NÃO implementar agora ("vou montar com
  calma"); app_key/app_secret NUNCA vão pro browser (vivem em env do
  servidor).
- Nenhum deploy remoto do omie-mcp.

Agora: comece lendo a spec e o plano F0–F1, e me mostre o MAPA DO QUE FALTA
planejar (F2, F3, sheets-export, deploy) antes de começar o brainstorming.
```

---

## Notas de manutenção deste prompt

- Este é o prompt do "planejamento total" do labarr-api. Quando uma fase for
  planejada, atualize a seção "Ponto de partida" pra apontar o plano novo —
  o objetivo é que o prompt sempre reflita o que já existe e o que falta.
- O plano F0–F1 ainda não está commitado no omie-mcp quando este prompt foi
  criado — commite ele antes de abrir a sessão de planejamento pra não
  perder o trabalho.
- Quando a execução começar (repo labarr-api criado), este prompt vira
  histórico; o fluxo passa pros planos correspondentes.
- Ligado a [[project_omie_mcp_arquitetura_alvo_monorepo]],
  [[feedback_preferir_superpowers]], [[project_omie_mcp_deploy_remoto]] e
  [[feedback_manter_docs_atualizados]] na memória do assistente.
