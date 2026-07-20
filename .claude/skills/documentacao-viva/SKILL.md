---
name: documentacao-viva
description: Mantém a documentação viva do projeto sempre atualizada e versionada em formato de checklist. Use esta skill sempre que uma implementação nova for criada OU uma implementação existente for alterada — em lógica, regra de negócio, UX/UI, padrão de projeto/arquitetura, banco de dados, ferramenta/dependência ou API/integração. Ative também quando o usuário disser "documenta isso", "atualiza a documentação", "registra essa mudança", ou ao final de qualquer tarefa de implementação/alteração de código neste projeto — mesmo que o usuário não peça explicitamente para documentar. Nenhuma mudança de código relevante deve escapar de ser registrada e versionada.
---

# Documentação Viva

Mantém em `docs/` um retrato sempre atualizado de tudo que já foi implementado no projeto, organizado por domínio e versionado com data + autor. O objetivo é que qualquer pessoa (ou o próprio Claude, numa sessão futura) consiga entender o estado atual do projeto lendo só esses arquivos — sem precisar vasculhar o código ou o histórico do git.

## Regra de ouro

Depois de implementar ou alterar qualquer coisa relevante no projeto, **antes de considerar a tarefa concluída**, pare e pergunte a si mesmo: "isso precisa entrar na documentação viva?". Na dúvida, a resposta é sim. Só pule o registro para mudanças triviais que não afetam lógica, negócio, UX/UI, arquitetura, banco de dados, ferramentas ou API (ex: corrigir um typo em comentário, reformatação de código sem mudança de comportamento).

## Estrutura de arquivos

Todos os arquivos vivem em `docs/` na raiz do projeto:

```
docs/
├── GERAL.md            # índice mestre — toda implementação aparece aqui
├── UX-UI.md             # interface, layout, interação, acessibilidade
├── LOGICA.md             # algoritmos, funções, regras técnicas, cálculos
├── NEGOCIO.md            # regras de negócio, requisitos, fluxos
├── PADRAO-PROJETO.md     # arquitetura, padrões de design, convenções
├── BANCO-DE-DADOS.md     # schema, migrations, queries, índices
├── FERRAMENTAS.md        # dependências, libs, dev tools, CI/CD, build
└── API.md                # endpoints, integrações externas, contratos
```

Se `docs/` ou algum desses arquivos ainda não existir no projeto, crie-o a partir do template correspondente em `templates/` desta skill antes de adicionar a primeira entrada.

## Guia de domínio — qual(is) arquivo(s) usar

Uma mudança pode afetar mais de um domínio ao mesmo tempo (ex: uma feature nova pode mexer em NEGOCIO.md + LOGICA.md + UX-UI.md simultaneamente). Nesse caso, crie uma entrada em **cada** arquivo de domínio relevante, e uma única linha em GERAL.md linkando para todas elas.

| Arquivo | Quando usar |
|---|---|
| `UX-UI.md` | Mudança visual, de layout, componente de interface, fluxo de interação, responsividade, acessibilidade |
| `LOGICA.md` | Novo algoritmo, função, cálculo, validação técnica, refatoração de lógica interna |
| `NEGOCIO.md` | Nova regra de negócio, requisito vindo do cliente/stakeholder, fluxo/processo do domínio do negócio |
| `PADRAO-PROJETO.md` | Decisão de arquitetura, padrão de design adotado, convenção de código, estrutura de pastas |
| `BANCO-DE-DADOS.md` | Nova tabela/coleção, migration, mudança de schema, índice, query relevante |
| `FERRAMENTAS.md` | Nova dependência/lib, ferramenta de dev, configuração de build, pipeline de CI/CD |
| `API.md` | Novo endpoint, mudança de contrato, integração com serviço externo |

Se não tiver certeza do domínio, pergunte ao usuário em vez de chutar.

## Fluxo de trabalho

1. **Identifique o(s) domínio(s)** afetados pela implementação/mudança usando a tabela acima.
2. **Monte o rascunho** de cada entrada necessária (uma por arquivo de domínio afetado) seguindo o formato abaixo, mais a linha correspondente no índice `GERAL.md`.
3. **Decida se é item novo ou atualização** (veja regra abaixo).
4. **Mostre o rascunho completo ao usuário no chat antes de salvar.** Só grave nos arquivos depois de confirmação explícita — nunca salve silenciosamente.
5. Depois de confirmado: crie o(s) arquivo(s) de domínio a partir do template se ainda não existirem, adicione a(s) entrada(s) ao final do arquivo (ordem cronológica) e adicione/atualize a linha correspondente em `GERAL.md`.
6. Gere os links de âncora entre `GERAL.md` e os arquivos de domínio (regra de âncora abaixo).

## Formato da entrada (obrigatório em todos os arquivos de domínio)

```markdown
- [x] {Nome da implementação}: {resumo objetivo de uma linha do que é}
  - **Data:** {AAAA-MM-DD} | **Autor:** {nome}
  - **Arquivos afetados:** `{caminho/arquivo1}`, `{caminho/arquivo2}`
  - **Motivo/contexto:** {por que essa mudança foi feita}
```

**Linha correspondente em `GERAL.md`** (uma por entrada, linkando para cada arquivo de domínio tocado):

```markdown
- [x] {Nome da implementação} — {AAAA-MM-DD} — [Domínio](./ARQUIVO.md#âncora-do-nome-da-implementação)
```

Se a mudança tocar mais de um domínio, liste os links separados por vírgula: `[Lógica](./LOGICA.md#...) · [UX/UI](./UX-UI.md#...)`.

### Autor

O autor padrão deste projeto é **Walesson**, a menos que o usuário informe outro nome explicitamente para uma entrada específica (projeto com múltiplos colaboradores).

### Regra de âncora (link entre GERAL.md e os arquivos de domínio)

Gere a âncora a partir do "Nome da implementação": deixe tudo minúsculo, troque espaços por hífen, remova pontuação (`:`, `,`, `.`, etc.), mantenha acentos e letras normalmente. Exemplo:

- Nome: `Validação de CPF no cadastro de usuário`
- Âncora: `#validação-de-cpf-no-cadastro-de-usuário`

## Item novo x atualização de item existente

- **Feature/mudança nova** → sempre cria uma entrada nova no final do arquivo. Nunca reescreve ou apaga entradas antigas — a documentação viva preserva o histórico.
- **Ajuste ou correção em algo documentado recentemente** (mesma sessão de trabalho ou mudança pequena sobre uma entrada já existente) → edita a entrada existente: atualiza o resumo se necessário e adiciona um campo `**Atualizado em:** {AAAA-MM-DD}` logo abaixo da linha de Data/Autor original, mantendo o autor original e acrescentando quem atualizou se for diferente.

Na dúvida entre os dois casos, pergunte ao usuário.

## Exemplo completo

Implementação: validação de CPF no cadastro de usuário, tocando lógica e negócio.

**Em `docs/LOGICA.md`:**
```markdown
- [x] Validação de CPF no cadastro de usuário: adiciona validação de dígito verificador antes de persistir o usuário
  - **Data:** 2026-07-17 | **Autor:** Walesson
  - **Arquivos afetados:** `src/services/user.service.ts`, `src/validators/cpf.validator.ts`
  - **Motivo/contexto:** evitar cadastro de CPFs inválidos que quebravam a integração com o Serasa
```

**Em `docs/NEGOCIO.md`:**
```markdown
- [x] Validação de CPF no cadastro de usuário: passa a ser obrigatório CPF válido para concluir o cadastro
  - **Data:** 2026-07-17 | **Autor:** Walesson
  - **Arquivos afetados:** `src/services/user.service.ts`
  - **Motivo/contexto:** exigência de compliance para evitar fraude no cadastro
```

**Em `docs/GERAL.md`:**
```markdown
- [x] Validação de CPF no cadastro de usuário — 2026-07-17 — [Lógica](./LOGICA.md#validação-de-cpf-no-cadastro-de-usuário) · [Negócio](./NEGOCIO.md#validação-de-cpf-no-cadastro-de-usuário)
```

## Templates

Os templates de cada arquivo (com o cabeçalho padrão) estão em `templates/` nesta skill. Use-os para criar qualquer arquivo de `docs/` que ainda não exista no projeto — não invente um cabeçalho diferente.