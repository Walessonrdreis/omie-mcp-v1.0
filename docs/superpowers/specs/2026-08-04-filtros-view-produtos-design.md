# Filtros da view_produtos (skill omie-data)

Status: aprovado

## Contexto

O piloto Produtos da skill `omie-data` está completo: `view_produtos` é consultada
sem nenhum filtro (`SELECT * ... ORDER BY gerado_em DESC`). Este design adiciona
filtros de busca à Consulta, mantendo o modelo Dado Bruto → View já fixado em
`packages/omie-data/CONTEXT.md` e `docs/adr/0001-views-pre-cruzadas-por-pergunta.md`.

Este é o passo antes do módulo de estoque (ver `project_omie_data_modulo_estoque_pendente`
em memória) — os filtros continuam funcionando sem retrabalho quando estoque virar
mais uma coluna via join na Tradução.

## Flags do CLI (`produtos`)

| Flag | Comportamento |
|---|---|
| `--busca <texto>` | LIKE case-insensitive contra `nome` **OU** `codigo` (um termo, dois campos) |
| `--categoria <texto>` | LIKE case-insensitive contra `categoria` |
| `--ativo <sim\|nao>` | Igualdade exata, mapeado para `"Sim"`/`"Não"` (formato já salvo na view) |
| `--ajuda` | Ver "Modo `--ajuda`" abaixo |
| `--atualizar` | Já existe — continua funcionando junto com os filtros (coleta/traduz antes de filtrar) |

Todas as flags de filtro passadas juntas combinam com **AND** — sem suporte a OR
entre filtros diferentes (não há caso de uso concreto para isso ainda).

## Consulta (`consultar-produtos.ts`)

`consultarProdutos(db, filtros?)` passa a aceitar um objeto opcional
`{ busca?: string; categoria?: string; ativo?: "Sim" | "Não" }`.

Monta um único `WHERE` parametrizado combinando com AND só as cláusulas presentes:

- `busca` → `(LOWER(nome) LIKE ? OR LOWER(codigo) LIKE ?)`
- `categoria` → `LOWER(categoria) LIKE ?`
- `ativo` → `ativo = ?`

O `SELECT` continua simples, numa única view (`view_produtos`) — nenhum join novo
é introduzido na Consulta, mantendo a regra do ADR-0001 (join acontece só na
Tradução).

## Modo `--ajuda`

Comportamento depende de `process.stdout.isTTY`:

**TTY (terminal real, uso direto fora da skill):**
Abre um prompt interativo via `@inquirer/prompts`:
1. `select` inicial: busca / categoria / ativo / sem filtro.
2. Para busca e categoria: prompt `search` do `@inquirer/prompts` — a cada tecla
   digitada, roda a query LIKE no SQLite (1957 produtos, consulta trivial) e
   re-lista os resultados ao vivo, tipo autocomplete de frontend. Navegação por
   seta + Enter (prompts de terminal não suportam clique de mouse nativamente —
   limitação padrão da categoria de ferramenta, não implementada aqui).
3. Para ativo: `select` simples sim/não.
4. Ao final, roda a consulta já filtrada e imprime o resultado no mesmo formato
   do modo não-interativo.

**Sem TTY (skill chamando via subprocess, caso do chat):**
Imprime uma lista estática — cada filtro disponível com um exemplo de uso — e
sai (sem tentar abrir prompt, que travaria sem TTY). Formato:
```
--busca <texto>      ex: produtos --busca arroz
--categoria <texto>  ex: produtos --categoria bebida
--ativo <sim|nao>    ex: produtos --ativo sim
```

## Integração com a skill (chat)

Quando o usuário pede produtos sem especificar filtro, a skill roda
`produtos --ajuda`, lê a saída estática (não-TTY) e monta uma pergunta com
opções clicáveis (via AskUserQuestion), reaproveitando o texto já retornado —
sem reprocessar ou gerar a lista de filtros "na mão", economizando tokens.

Quando o usuário já expressa o filtro em linguagem natural ("produtos de
bebida", "produto ativo"), a skill traduz direto para a flag correspondente,
sem passar pelo `--ajuda`.

## Dependência nova

`@inquirer/prompts` — dependência de produção do pacote `omie-data`, usada
apenas no branch TTY do `--ajuda`.

## Fora de escopo

- Suporte a mouse em terminal puro.
- Filtro por OR entre categorias/buscas diferentes.
- Qualquer coisa relacionada a estoque (fica pro próximo brainstorming, após
  este trabalho estar commitado).
