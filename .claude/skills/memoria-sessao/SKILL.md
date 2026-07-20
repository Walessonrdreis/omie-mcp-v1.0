---
name: memoria-sessao
description: Mantém um log cronológico do contexto de cada sessão/chat de trabalho neste projeto, em docs/CONTEXTO-SESSOES.md, para que qualquer nova conversa (ou qualquer pessoa) consiga entender rapidamente onde o trabalho parou. Use esta skill ao final de qualquer conversa ou tarefa relevante neste projeto — implementação, decisão de arquitetura, investigação de bug, mudança de escopo — mesmo que o usuário não peça explicitamente. Ative também quando o usuário disser "salva o contexto", "registra essa sessão", "o que fizemos até agora", "resume essa conversa", ou pedir para retomar de onde parou. Complementa (não substitui) a skill documentacao-viva: aquela registra O QUE foi implementado por domínio técnico; esta registra O QUE aconteceu em cada sessão de trabalho, decisões tomadas e pendências.
---

# Memória de Sessão

Mantém em `docs/CONTEXTO-SESSOES.md` um log cronológico de cada sessão de trabalho relevante neste projeto: o que foi discutido/feito, decisões tomadas e o que ficou pendente. O objetivo é que uma nova conversa (nova sessão do Claude, ou outra pessoa da equipe) consiga ler esse arquivo e retomar o trabalho sem precisar reconstruir o contexto a partir do histórico de chat.

Esta skill tem dois destinos de gravação, sempre juntos:

1. **`docs/CONTEXTO-SESSOES.md`** — versionado no git, visível a qualquer pessoa/sessão que abrir o projeto. É a fonte oficial.
2. **Memória privada do Claude Code** (sistema de memória do usuário, tipo `project`) — reforça o mesmo contexto para sessões futuras deste mesmo usuário/máquina, mesmo antes de o Claude ler o arquivo do repositório.

## Regra de ouro

Ao final de qualquer conversa ou tarefa relevante — implementação, decisão de arquitetura, investigação, mudança de escopo, correção de bug não trivial — **antes de encerrar**, pare e pergunte a si mesmo: "se uma nova conversa começasse agora do zero, o que ela precisaria saber para continuar de onde paramos?". Se a resposta não é óbvia a partir do código/git/documentação viva, registre aqui.

Pule o registro para trocas triviais (perguntas pontuais já respondidas, leituras exploratórias sem decisão, correções cosméticas).

## Quando ler este arquivo

No **início** de uma sessão de trabalho neste projeto, se houver dúvida sobre o estado atual ou o usuário referenciar "o que fizemos antes"/"continuando de onde paramos", leia as últimas entradas de `docs/CONTEXTO-SESSOES.md` antes de perguntar ao usuário.

## Formato da entrada

Se `docs/CONTEXTO-SESSOES.md` ainda não existir, crie-o a partir do template em `templates/CONTEXTO-SESSOES.md` desta skill.

Adicione a entrada ao **final** do arquivo (ordem cronológica — nunca reescreva ou apague entradas antigas):

```markdown
## {AAAA-MM-DD} — {Título curto da sessão}

- **Autor/Interlocutor:** {nome}
- **O que foi feito:** {resumo objetivo — 2 a 5 linhas, sem repetir o diff linha a linha}
- **Decisões tomadas:** {decisões relevantes e o porquê, se houver}
- **Pendências / próximos passos:** {o que ficou em aberto, ou "nenhuma" se a sessão fechou um ciclo}
- **Docs relacionadas:** {link para entradas em GERAL.md/domínio, se a sessão gerou documentação viva}
```

### Autor

O autor padrão deste projeto é **Walesson**, a menos que o usuário informe outro nome.

## Fluxo de trabalho

1. Ao identificar que a conversa está encerrando (ou o usuário pedir explicitamente) e que houve algo relevante, monte o rascunho da entrada no formato acima.
2. **Mostre o rascunho ao usuário no chat antes de salvar.** Só grave depois de confirmação explícita — nunca salve silenciosamente, mesmo sendo uma skill automática.
3. Depois de confirmado:
   - Crie `docs/CONTEXTO-SESSOES.md` a partir do template se ainda não existir.
   - Adicione a entrada ao final do arquivo.
   - Salve/atualize a memória privada correspondente (tipo `project`) com o mesmo resumo essencial — decisões e pendências, não o texto inteiro —, seguindo as regras do sistema de memória (arquivo próprio + linha em `MEMORY.md`).
4. Se a sessão também gerou entradas de documentação viva (via skill `documentacao-viva`), referencie-as no campo "Docs relacionadas" em vez de duplicar o conteúdo.

## Item novo x atualização

- Cada sessão de trabalho gera **uma entrada nova**. Nunca edite entradas de sessões anteriores.
- Se a mesma sessão continuar depois de uma pausa longa mas ainda no mesmo tópico/dia, pergunte ao usuário se é continuação (edita a entrada do dia, atualizando "Pendências") ou sessão nova (nova entrada).

## Exemplo completo

```markdown
## 2026-07-17 — Criação da skill memoria-sessao

- **Autor/Interlocutor:** Walesson
- **O que foi feito:** criada a skill `memoria-sessao` para registrar o contexto de cada sessão de trabalho em docs/CONTEXTO-SESSOES.md, complementando a documentacao-viva.
- **Decisões tomadas:** log fica versionado no repo (não só na memória privada do Claude Code) para ser visível a qualquer colaborador; formato é cronológico por sessão, não um snapshot único.
- **Pendências / próximos passos:** nenhuma.
- **Docs relacionadas:** —
```

## Templates

O template com o cabeçalho padrão está em `templates/CONTEXTO-SESSOES.md` desta skill. Use-o para criar o arquivo em `docs/` caso ainda não exista — não invente um cabeçalho diferente.
