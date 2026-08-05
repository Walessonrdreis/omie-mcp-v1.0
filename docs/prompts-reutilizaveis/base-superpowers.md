# Prompt reutilizável: base pra usar o plugin superpowers

Prompt genérico pra iniciar qualquer tarefa nova neste repo (omie-mcp) usando
o fluxo do plugin **superpowers** (brainstorming → writing-plans →
subagent-driven-development), sem precisar redigitar as preferências de
processo toda vez. Cole no início da sessão e complete a última linha com o
que você quer construir/mudar.

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
   docs/superpowers/specs/YYYY-MM-DD-<topico>-design.md e commite.
3. superpowers:writing-plans — plano de implementação detalhado, tarefas
   pequenas (TDD: teste que falha → confirma falha → implementa → confirma
   passa → commit), salvo em docs/superpowers/plans/YYYY-MM-DD-<topico>.md.
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
  escopo do plano atual, ou registrar como task nova/decisão separada, ou
  perguntar antes de misturar no que já está em andamento.
- Ao final, sempre apresentar as opções de finalizar branch (merge local /
  push+PR / manter como está) — nunca decidir sozinho por mim.
- Para mudanças pequenas e bem definidas (não uma feature nova), pode pular
  o processo completo de brainstorming→plano→subagentes e implementar
  direto com TDD — mas ainda assim confirmando o desenho comigo antes
  quando houver mais de uma forma razoável de fazer.

Agora: [DESCREVA AQUI O QUE VOCÊ QUER CONSTRUIR, CORRIGIR OU MUDAR]
```

---

## Notas de manutenção deste prompt

- Este prompt é intencionalmente genérico (não amarrado a nenhum módulo
  específico do omie-mcp). Pra contexto específico de UX do CLI omie-data,
  use [[melhoria-ux-cli-omie-data]] em vez deste, ou complemente este com
  aquele.
- Se as preferências de processo mudarem (ex.: parar de exigir worktree
  pra tudo, mudar convenção de commit), atualize a lista acima — ela reflete
  decisões já tomadas em sessões anteriores, não regras universais do
  superpowers em si.
