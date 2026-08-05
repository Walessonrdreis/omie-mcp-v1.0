# Prompt reutilizável: melhoria de UX terminal/CLI do omie-data

Cole este prompt no início de uma nova sessão quando quiser continuar
melhorando a experiência de uso do CLI `omie-data` no terminal (fora do
chat) — menus interativos, navegação, prompts, formatação de saída.

---

## Prompt

```
Vamos continuar melhorando a UX do CLI da skill omie-data (pacote
packages/omie-data/ no repo omie-mcp), especificamente o uso direto no
terminal via `omie-data` (linkado globalmente com `npm link`), fora do
chat/skill.

Contexto do que já existe (branch omie-skill-clean):

1. `omie-data` sozinho (sem subcomando) abre um MENU PRINCIPAL interativo:
   Produtos | Ajuda | Configurar | Sair — implementado em
   packages/omie-data/src/application/rodar-menu-principal.ts
   (rodarMenuPrincipal, testável via injeção de IPromptsMenu).

2. Ao escolher "Produtos", entra num LOOP DE PRODUTOS:
   - Pergunta se quer atualizar dado da Omie antes (Sim/Não).
   - Menu de filtro: Busca (nome ou código, com live-search) | Categoria |
     Ativo | Sem filtro | Voltar | Sair.
   - Mostra resultado numa tabela formatada (colunas alinhadas, data em
     horário de Brasília, idade em HH:MM:SS).
   - Depois de mostrar, pergunta: Continuar (nova busca) | Menu principal |
     Sair.
   Tudo isso em packages/omie-data/src/application/rodar-ajuda-interativo.ts
   (rodarAjudaInterativa = uma iteração; rodarAjudaInterativaEmLoop = loop
   completo com a pergunta de "próxima ação"; testável via IPromptsInterativos).

3. "Configurar" pede App Key e App Secret no prompt (secret mascarado).

4. Todo prompt interativo usa `@inquirer/prompts` (select/input/password/search),
   injetado via interface (IPromptsInterativos, IPromptsMenu) com uma
   implementação real (criarPromptsReais/criarPromptsMenuReais) e fakes nos
   testes — nunca teste a lib de prompt em si, só a lógica de orquestração.

5. `cli.ts` (packages/omie-data/src/cli.ts) é a camada mais fina possível:
   parseia argv, decide TTY vs não-TTY (process.stdout.isTTY), decide se
   abre menu, formata a saída (formatarResultadoProdutos — tabela quando
   TTY, JSON cru quando não-TTY/skill), e faz o wiring entre os módulos de
   application/. Tem um `deveAbrirMenuInterativo()` puro e testável pra
   essa decisão.

6. Padrão de arquitetura do pacote (não mexer sem necessidade):
   Dado Bruto (raw_*) → Coleta → Tradução → View (view_*) → Consulta.
   Ver packages/omie-data/CONTEXT.md e
   packages/omie-data/docs/adr/0001-views-pre-cruzadas-por-pergunta.md
   antes de propor qualquer mudança de modelo de dados.

7. `omie-data` está linkado globalmente via `npm link` — pra testar mudança
   depois de editar: `npm --prefix packages/omie-data run build` e rodar
   `omie-data <comando>` direto no terminal (fora do chat, é o único jeito
   de testar TTY interativo de verdade — o sandbox do Claude Code não tem
   TTY real).

Preferências de processo já estabelecidas nesta sessão:
- Sempre confirmar o desenho da UX comigo (pergunta objetiva, 2-4 opções)
  antes de implementar — não assumir.
- TDD: escrever teste que falha, confirmar falha, implementar, confirmar
  passa. Rodar suíte inteira + build antes de cada commit.
- Um commit por mudança coerente, mensagem explicando o "porquê", não só o
  "o quê".
- Não usar mock de biblioteca de prompt — sempre DI com fake simples
  (função async que retorna valor fixo, testando a orquestração).
- Não overengenheirar: se a mudança pedida é pequena, implementar direto
  sem passar pelo processo completo de brainstorming→plano→subagentes
  (esse processo é só pra features grandes/novas, não pra ajustes de UX
  incrementais como estes).

Agora: [DESCREVA AQUI A MELHORIA DE UX QUE VOCÊ QUER — ex: "quero que a
tabela de produtos pagine quando tiver muitos resultados", "quero atalho
de teclado pra sair mais rápido", "quero cores no terminal", etc.]
```

---

## Notas de manutenção deste prompt

- Se a arquitetura do menu mudar (novos módulos, novos tipos de retorno tipo
  `ResultadoAjudaInterativa`), atualize a seção "Contexto do que já existe"
  acima — este prompt fica desatualizado rápido se não for revisado a cada
  mudança estrutural grande no CLI.
- Ligado a [[project_omie_data_modulo_estoque_pendente]] e
  [[feedback_foco_omie_data_nao_mcp]] na memória do assistente — se estoque
  virar realidade, este prompt também deve ganhar uma nota sobre onde a
  coluna de estoque aparece na tabela formatada.
