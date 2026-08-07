# Prompt reutilizável: spec + planejamento do módulo de Ordem de Produção (OP) no omie-data

Cole este prompt no início de uma **nova sessão** pra começar do zero (via
superpowers) o design e o plano de implementação do módulo de Ordens de
Produção no pacote `omie-data`. Diferente do prompt de Estoque, aqui ainda
NÃO existe spec nem plano — a sessão deve produzir os dois, seguindo o fluxo
completo do superpowers a partir do brainstorming.

---

## Contexto pra colar junto (não é o prompt em si — é o que a IA precisa saber)

- **O que já existe no `omie-data`:** cache local (SQLite) em
  `packages/omie-data/`, hoje com os módulos Produtos e Estoque
  (`src/modules/produtos/`, `src/modules/estoque/`). Padrão estabelecido por
  módulo: `domain/` (tipos crus da Omie), `application/` (`collect-*`,
  `translate-*`, `consultar-*`, `rodar-*`), interface HTTP própria em
  `src/domain/<modulo>-http-client.ts`, implementada tanto por
  `OmieHttpClientReal` quanto por `FakeHttpClient` (ambos em
  `src/infrastructure/`).
- **Referência viva do contrato real da API de OP:** o servidor MCP
  principal (raiz do repo, não o pacote `omie-data`) já tem um gateway de
  Ordem de Produção funcionando em produção —
  `src/modules/ordemProducao/infrastructure/gateways/op-omie-gateway.ts` e a
  interface `src/modules/ordemProducao/domain/interfaces/op-gateway.ts`.
  **Usar como fonte de verdade pros nomes de campo e formato de
  requisição/resposta da Omie** — não adivinhar nem inventar nomes de campo
  a partir de doc pública, foi exatamente isso que causou um bug de HTTP 500
  no módulo de Estoque (nomes de campo inventados na requisição). Ver
  `docs/superpowers/plans/2026-08-06-estoque-omie-data.md` pra entender o
  histórico desse bug e como foi corrigido, como exemplo do que evitar.
- **Estrutura de dados de OP** (resumo do gateway real, pra acelerar o
  brainstorming — confirmar contra o arquivo real antes de decidir o design
  final): `OrdemProducao` tem `identificacao` (código, número, produto,
  quantidade, local de estoque, data prevista), `infAdicionais` (etapa do
  kanban — código cru, sem tradução fixa — datas de início/conclusão,
  projeto), `outrasInf` (concluída sim/não, data de conclusão/inclusão).
  Paginação via `listarOrdensPagina`. Existe também `consultarOP` (detalhe
  com itens/observações) e operações de escrita (`incluirOP`, `alterarOP`,
  `excluirOP`) — decidir no brainstorming se entram no escopo do `omie-data`
  (que hoje é só leitura/cache) ou ficam de fora, como estoque deixou os
  ajustes de fora.
- **Perguntas em aberto pro brainstorming** (não decidir sozinho, perguntar
  ao usuário): OP vira coluna em alguma view existente (como estoque virou
  coluna de `view_produtos`) ou precisa de uma `view_ordens_producao`
  própria? Faz sentido cruzar com produto (nome/categoria) pra facilitar
  busca? O CLI precisa de um comando novo (`omie-data op ...`) ou só
  enriquece o que já existe? Escopo é só leitura (como Estoque) ou inclui
  criar/alterar/excluir OP a partir do cache local?

---

## Prompt

```
Vamos trabalhar numa tarefa neste repo (omie-mcp) usando o plugin
superpowers, que já está instalado globalmente e é a primeira opção de
workflow deste projeto — não uma alternativa.

Siga o fluxo padrão do superpowers:
1. superpowers:brainstorming — explora intenção, requisitos e design antes
   de qualquer código. Me faça perguntas objetivas (2-4 opções quando fizer
   sentido) até o design estar claro. NÃO implemente nada nesta fase.
2. Depois do design aprovado, escreva a spec em
   docs/superpowers/specs/YYYY-MM-DD-op-omie-data-design.md e commite.
3. superpowers:writing-plans — plano de implementação detalhado, tarefas
   pequenas (TDD: teste que falha → confirma falha → implementa → confirma
   passa → commit), salvo em docs/superpowers/plans/YYYY-MM-DD-op-omie-data.md.
4. Pergunte qual modo de execução eu prefiro: Subagent-Driven (recomendado,
   um subagente fresco por task + revisão) ou Inline.
5. Se Subagent-Driven: use superpowers:using-git-worktrees pra isolar o
   trabalho (peça meu consentimento antes de criar o worktree), depois
   superpowers:subagent-driven-development — dispatch por task, revisão de
   task (spec + qualidade), revisão final de branch inteira, loop de
   correção quando a revisão achar findings Important/Critical.

Preferências de processo já estabelecidas neste projeto:
- Nunca trabalhar direto numa branch principal sem meu consentimento
  explícito — sempre branch nova ou worktree.
- Se o worktree for criado a partir de uma branch de trabalho (não
  main/master), usar o HEAD local dessa branch como base — nunca partir de
  origin/main se isso descartar commits locais ainda não publicados.
- TDD sempre: nenhum código de implementação sem teste que falhou primeiro.
  Rodar a suíte inteira + build antes de cada commit.
- Um commit por mudança coerente (task do plano, ou ajuste pontual), nunca
  acumular várias mudanças não relacionadas num commit só. Mensagem de
  commit explica o "porquê", não só o "o quê".
- Revisão de task nunca pula: conformidade de spec E qualidade de código,
  mesmo que o "implementador" seja eu mesmo direto (sem subagente) numa
  mudança pequena.
- Não fazer scope creep: se durante a implementação eu pedir algo fora do
  escopo do plano atual, registrar como task nova/decisão separada, ou
  perguntar antes de misturar no que já está em andamento.
- Ao final, sempre apresentar as opções de finalizar branch (merge local /
  push+PR / manter como está) — nunca decidir sozinho por mim.
- Antes de fixar nomes de campo/formato de requisição pra qualquer chamada
  real da API Omie, conferir contra um gateway já funcionando no servidor
  MCP principal (src/modules/<modulo>/infrastructure/gateways/*.ts) em vez
  de inventar a partir de doc pública ou do pseudocódigo do plano — isso já
  causou um bug de produção (HTTP 500) no módulo de Estoque.

Contexto específico deste módulo (OP):
- Módulo já existe no `omie-data`: Produtos (`src/modules/produtos/`) e
  Estoque (`src/modules/estoque/`), seguindo o padrão
  domain/application/infrastructure por módulo.
- Referência viva do contrato real da API: gateway de OP já funcionando no
  servidor MCP principal —
  src/modules/ordemProducao/infrastructure/gateways/op-omie-gateway.ts e
  src/modules/ordemProducao/domain/interfaces/op-gateway.ts. Usar como fonte
  de verdade pra nomes de campo, não adivinhar.
- Estrutura de OP: identificacao (código, número, produto, quantidade,
  local de estoque, data prevista), infAdicionais (etapa do kanban — código
  cru sem tradução fixa —, datas, projeto), outrasInf (concluída, datas).
  Tem paginação (listarOrdensPagina), consulta detalhada (consultarOP) e
  operações de escrita (incluirOP/alterarOP/excluirOP).
- Perguntas que preciso responder no brainstorming, então me pergunte:
  OP vira coluna numa view existente ou precisa de view própria
  (view_ordens_producao)? Cruza com produto (nome/categoria) pra facilitar
  busca? CLI ganha comando novo (omie-data op ...) ou só enriquece o que já
  existe? Escopo é só leitura (como Estoque) ou inclui escrita
  (incluir/alterar/excluir) a partir do cache local?

Agora: comece o brainstorming do módulo de Ordem de Produção (OP) no
pacote omie-data.
```

---

## Notas de manutenção deste prompt

- Este prompt é o "irmão anterior" de `omie-data-estoque.md` — aquele
  assume que a spec e o plano já existem (fase de execução); este assume
  que nada existe ainda (fase de brainstorming). Depois que a spec e o
  plano de OP forem escritos, vale criar um `omie-data-op-execucao.md` no
  mesmo formato de `omie-data-estoque.md`, apontando pro plano gerado.
- Bug conhecido de npm: instalar sempre com `cd packages/omie-data` antes
  de `npm install` (nunca `npm install --prefix packages/omie-data`), senão
  reintroduz `omie-mcp:file:../..` no `package.json`.
- Achado de ambiente conhecido: `vitest.config.ts` do `omie-data` não
  exclui `dist/` do glob de testes — rodar `rm -rf dist` antes de
  `npm test` sempre que houver um `dist/` de build anterior, senão a
  contagem de testes aparece dobrada (falso positivo de cobertura).
- Ligado a [[project_omie_data_npm_bug]] na memória.
