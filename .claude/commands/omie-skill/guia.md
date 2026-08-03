---
description: Explica como usar a skill omie-skill (o que é, como funciona o cache, quais comandos existem) e, opcionalmente, mostra as ferramentas de um módulo específico.
argument-hint: [módulo ou operação, opcional — ex: "estoque", "pedido de venda"]
---

Objetivo deste comando: ser o ponto de entrada de "como eu uso essa skill?" —
tanto pra quem nunca usou quanto como atalho rápido pra achar a ferramenta
`omie_*` certa, sem ler `docs/FERRAMENTAS.md` inteiro.

## Se `$ARGUMENTS` estiver vazio

Mostre um guia curto explicando a skill, nesta ordem:

1. **O que é**: a skill `omie-skill` guarda uma referência cacheada, um
   arquivo por módulo, de todas as ferramentas `omie_*` do servidor MCP
   `omie-mcp` (produtos, estoque, ordens de produção, financeiro, CRM, NF-e,
   etc.) — em `.claude/skills/omie-skill/cache/`. Existe pra não precisar
   carregar `docs/FERRAMENTAS.md` (1500+ linhas) toda vez que for chamar uma
   tool.
2. **Como consultar uma ferramenta**: rode `/omie-skill:guia <módulo ou
   operação>` (ex: `/omie-skill:guia estoque`) — ou simplesmente descreva a
   tarefa numa mensagem normal, a skill dispara sozinha quando relevante.
3. **Os três comandos disponíveis**, em uma tabela:

   | Comando | Uso |
   |---|---|
   | `/omie-skill:guia [módulo]` | Sem argumento: este guia. Com argumento: mostra as ferramentas daquele módulo. |
   | `/omie-skill:atualizar-cache` | Regenera o cache (`npm run skill-cache`) depois de mudar `src/tools/registry.ts` ou `src/modules/**`. |
   | `/omie-skill:verificar-cache` | Só checa se o cache está desatualizado, sem regenerar. |

4. Termine listando os módulos disponíveis: leia
   `.claude/skills/omie-skill/cache/_index.md` e mostre a tabela de módulos
   (nome, quantidade de ferramentas, resumo de uma linha), como sugestão do
   que consultar em seguida.

Se `.claude/skills/omie-skill/cache/manifest.json` não existir ou `cache/`
estiver vazio, avise que o cache ainda não foi gerado e sugira rodar
`/omie-skill:atualizar-cache` antes de mais nada.

## Se `$ARGUMENTS` indicar um módulo ou operação (ex: "estoque", "contas a pagar")

Pule a explicação longa acima. Vá direto ao ponto:

1. Consulte `.claude/skills/omie-skill/cache/_index.md` pra achar o arquivo
   do módulo correspondente ao argumento.
2. Abra `.claude/skills/omie-skill/cache/<arquivo>` e resuma as ferramentas
   daquele módulo (nome, o que faz, parâmetros obrigatórios, se é
   destrutiva).
3. Se o argumento não bater com nenhum módulo da tabela, diga isso e mostre
   a tabela de módulos como nas instruções acima, pra o usuário escolher.

Em nenhum dos dois casos abra `docs/FERRAMENTAS.md` completo — o objetivo do
comando é responder com o cache, que já é a fração relevante.
