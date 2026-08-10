# Documentação própria da API Omie (chão de fábrica) — Implementation Plan

> **Execução:** na `main`, uma sessão por bloco — ver **[Divisão por sessão](#divisão-por-sessão)** logo abaixo das constraints. Cada sessão executa suas tasks com superpowers:executing-plans e termina em commit. Os steps usam checkbox (`- [ ]`) para rastreio; marque conforme avança.

**Goal:** Construir `docs/omie-api/` — referência da API Omie para os cinco recursos de chão de fábrica, em arquivos curtos e navegáveis, com dicionário de nomenclatura divergente e marcação de confiança por afirmação.

**Architecture:** Um diretório por recurso, sempre com os mesmos cinco arquivos (`README`, `leitura`, `escrita`, `campos`, `armadilhas`), mais transversais (`convencoes/`, `glossario/`) e um índice mestre. O conteúdo vem de três fontes com precedência definida: resposta real > código do repo > doc oficial. Um script Node valida tamanho, links e preenchimento — é a única automação.

**Tech Stack:** Markdown; Node 20 (ESM, `.mjs`) para o verificador; vitest para os testes do verificador; tools MCP `omie_*` já existentes para a coleta ao vivo.

**Spec:** `docs/superpowers/specs/2026-08-10-doc-api-omie-chao-de-fabrica-design.md`

## Global Constraints

- **Idioma:** todo o conteúdo em português do Brasil.
- **Limite de tamanho:** nenhum arquivo de `docs/omie-api/` passa de **200 linhas**. Se passar, quebra por método (`leitura-listar.md`, `leitura-consultar.md`) e o `README.md` do recurso absorve os links novos.
- **Marcação de confiança obrigatória** em toda afirmação sobre comportamento da API: `✅` observado ao vivo nesta coleta · `🔧` derivado do código que roda em produção · `📖` só da doc oficial, não verificado.
- **Proibido executar escrita contra a Omie.** Nenhum `Incluir*`, `Alterar*`, `Excluir*`. Só `Listar*`/`Consultar*`. O conteúdo de `escrita.md` vem do código e da doc, marcado `🔧`/`📖`.
- **Sem célula de tabela vazia.** Use `—` quando não se aplica, ou a marca de confiança quando não verificado.
- **Arquivo de fase futura não vira link markdown.** Referencie como código inline — `` `estoque/campos.md` (fase v2) `` — porque todo link precisa resolver para o verificador passar. Ao criar o arquivo na fase dele, converta as referências pendentes em links de verdade.
- **Precedência quando as fontes divergem:** resposta real > código do repo > doc oficial. Divergência nunca é resolvida em silêncio — vira entrada em `armadilhas.md`.
- **Fronteira:** `docs/omie-api/` documenta a API da Omie (protocolo, campos, comportamento). `docs/FERRAMENTAS.md` documenta as tools MCP (assinatura, argumentos). A doc da API **não** repete assinatura de tool.
- **Gerenciador de pacotes:** `pnpm` na raiz. Nunca `npm install`.
- **Commits:** um por task, mensagem em português, prefixo `docs:` (ou `feat:` para o verificador).

---

## Divisão por sessão

Execução na `main`, uma sessão de Claude Code por bloco. O plano é dividido para
que **nenhuma sessão precise carregar o contexto da anterior** — o estado vive
nos commits e nos arquivos já escritos, não na conversa.

| Sessão | Tasks | Entrega | Fase |
|---|---|---|---|
| 1 | 1, 2 | Verificador funcionando + índice mestre | — |
| 2 | 3, 4 | Convenções + glossário | — |
| 3 | 5 | Recurso Produtos | v1 |
| 4 | 6 | Recurso Estrutura | fecha v1 |
| 5 | 7 | Recurso Estoque | v2 |
| 6 | 8 | Recurso Ordem de Produção | fecha v2 |
| 7 | 9 | Recurso Pedido de Venda | v3 |
| 8 | 10, 11 | Modelo frontend + gaps | fecha v3 |

### Como abrir cada sessão

Cole este prompt, trocando os números:

```
Execute as Tasks N e N+1 de docs/superpowers/plans/2026-08-10-doc-api-omie-chao-de-fabrica.md.

Leia primeiro: as seções "Global Constraints" e "Divisão por sessão" do plano,
e as tasks que vai executar. Não leia as outras tasks.
```

### Regras de contexto por sessão

Valem para todas as sessões — é o que impede o contexto de inchar:

1. **Leia só a sua task.** As tasks são autocontidas: cada uma lista os arquivos-fonte que precisa. Ler as outras onze não ajuda.
2. **Nunca abra `docs/FERRAMENTAS.md` (90k), `README.md` da raiz (46k) ou `docs/CONTEXTO-SESSOES.md` (59k) inteiros.** Se precisar de algo deles, use Grep com um padrão específico. Abrir qualquer um deles inteiro consome a sessão.
3. **Prefira ler as interfaces de domínio aos gateways.** `domain/interfaces/*-gateway.ts` tem os tipos das respostas e os comentários com os achados; o gateway de infraestrutura só acrescenta `resource`/`call`, que já estão citados na task.
4. **Não releia o que acabou de escrever.** As tabelas de campos já vêm pré-preenchidas nas tasks a partir das interfaces.
5. **Uma chamada de leitura ao vivo por método, com a menor página possível.** Guarde só o que responde "esse campo sempre vem?" — não cole a resposta inteira na conversa.

### Retomada e conferência

Cada sessão termina com commit, então `git log --oneline -5` mostra onde parou.
Para conferir o estado real antes de começar:

```bash
pnpm run verificar-doc-omie
git log --oneline -5
```

Se o verificador acusar problema em arquivo de uma sessão anterior, **corrija
antes de seguir** — a doc só é útil se cada fase fecha limpa.

Depois da sessão 4 (fecha v1), da 6 (fecha v2) e da 8 (fecha v3), a doc está
utilizável mesmo que você pare ali.

---

## Estrutura de arquivos

**Criados por este plano:**

| Caminho | Responsabilidade |
|---|---|
| `scripts/verificar-doc-omie.mjs` | Valida a doc: links, tamanho, células vazias |
| `scripts/verificar-doc-omie.test.mjs` | Testes do verificador |
| `docs/omie-api/README.md` | Índice mestre, fronteira, gatilho de atualização |
| `docs/omie-api/convencoes/request-auth.md` | Formato do POST, credenciais, base URL |
| `docs/omie-api/convencoes/paginacao.md` | Os dois dialetos de paginação da Omie |
| `docs/omie-api/convencoes/erros.md` | faultstring em HTTP 200, rate limit, retry |
| `docs/omie-api/convencoes/tipos-formatos.md` | Datas, decimais, flags `"S"`/`"N"` |
| `docs/omie-api/glossario/campos.md` | Tabela canônica de nomenclatura divergente |
| `docs/omie-api/glossario/conceitos.md` | Malha, etapa, saldo físico × disponível |
| `docs/omie-api/produtos/*` | 5 arquivos — `geral/produtos` |
| `docs/omie-api/estrutura/*` | 5 arquivos — `geral/malha` |
| `docs/omie-api/estoque/*` | 5 arquivos — `estoque/consulta` + `estoque/ajuste` |
| `docs/omie-api/ordem-producao/*` | 5 arquivos — `produtos/op` |
| `docs/omie-api/pedido-venda/*` | 5 arquivos — `produtos/pedido` |
| `docs/omie-api/90-modelo-frontend.md` | Receitas de cruzamento e shape agregado |
| `docs/omie-api/91-gaps-camada-propria.md` | httpServer/omie-data × Omie direto |

**Modificados:**

| Caminho | Mudança |
|---|---|
| `vitest.config.ts:10` | Incluir `scripts/**/*.test.mjs` no glob |
| `package.json:10-23` | Script `verificar-doc-omie` |

---

## Task 1: Verificador da doc

Ferramenta que sustenta os critérios de tamanho, navegabilidade e preenchimento. Vem primeiro porque todas as tasks seguintes a usam como teste.

**Files:**
- Create: `scripts/verificar-doc-omie.mjs`
- Create: `scripts/verificar-doc-omie.test.mjs`
- Modify: `vitest.config.ts:10`
- Modify: `package.json:10-23`

**Interfaces:**
- Consumes: nada.
- Produces: `verificarDocOmie(raiz: string) => Problema[]`, onde `Problema = { arquivo: string, linha: number, tipo: "tamanho" | "link" | "celula-vazia", mensagem: string }`. `arquivo` é caminho relativo a `raiz`, com `/` como separador em qualquer plataforma. `linha` é 1-indexada; para `tipo: "tamanho"` vale `0`. Todas as tasks seguintes rodam `pnpm run verificar-doc-omie` como teste.

- [x] **Step 1: Ampliar o glob do vitest**

Em `vitest.config.ts`, trocar o `include` (o comentário acima dele continua válido; acrescentar a segunda frase):

```typescript
import { defineConfig } from "vitest/config";

// A suíte da raiz cobre `src/**` e os scripts utilitários de `scripts/**`. Sem
// este `include`, o glob padrão do vitest varreria também `packages/omie-data`,
// duplicando a execução dos testes do pacote e transformando uma quebra lá
// dentro numa falha confusa aqui.
// Os testes do omie-data continuam sendo rodados por `npm test` de dentro do
// próprio pacote (é o único lugar onde `npm` é intencional neste repo).
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "scripts/**/*.test.mjs"],
  },
});
```

- [x] **Step 2: Escrever os testes que falham**

Criar `scripts/verificar-doc-omie.test.mjs`:

```javascript
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { verificarDocOmie } from "./verificar-doc-omie.mjs";

let raiz;

beforeEach(() => {
  raiz = fs.mkdtempSync(path.join(os.tmpdir(), "doc-omie-"));
});

afterEach(() => {
  fs.rmSync(raiz, { recursive: true, force: true });
});

function escrever(caminhoRelativo, conteudo) {
  const destino = path.join(raiz, caminhoRelativo);
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, conteudo, "utf8");
}

describe("limite de tamanho", () => {
  it("acusa arquivo acima de 200 linhas", () => {
    escrever("grande.md", "linha\n".repeat(201));

    const problemas = verificarDocOmie(raiz);

    expect(problemas).toHaveLength(1);
    expect(problemas[0].tipo).toBe("tamanho");
    expect(problemas[0].arquivo).toBe("grande.md");
    expect(problemas[0].linha).toBe(0);
  });

  it("aceita arquivo exatamente no limite", () => {
    escrever("no-limite.md", "linha\n".repeat(200));

    expect(verificarDocOmie(raiz)).toEqual([]);
  });
});

describe("links relativos", () => {
  it("acusa link que não resolve", () => {
    escrever("indice.md", "Veja [produtos](produtos/README.md).\n");

    const problemas = verificarDocOmie(raiz);

    expect(problemas).toHaveLength(1);
    expect(problemas[0].tipo).toBe("link");
    expect(problemas[0].linha).toBe(1);
    expect(problemas[0].mensagem).toContain("produtos/README.md");
  });

  it("aceita link que resolve", () => {
    escrever("indice.md", "Veja [produtos](produtos/README.md).\n");
    escrever("produtos/README.md", "# Produtos\n");

    expect(verificarDocOmie(raiz)).toEqual([]);
  });

  it("resolve link relativo a partir do diretório do arquivo", () => {
    escrever("produtos/README.md", "Volta pro [índice](../README.md).\n");
    escrever("README.md", "# Índice\n");

    expect(verificarDocOmie(raiz)).toEqual([]);
  });

  it("ignora link externo e âncora pura", () => {
    escrever("a.md", "[site](https://app.omie.com.br) e [topo](#secao)\n");

    expect(verificarDocOmie(raiz)).toEqual([]);
  });

  it("ignora a âncora ao resolver um link com fragmento", () => {
    escrever("a.md", "[campo](produtos/campos.md#ncodproduto)\n");
    escrever("produtos/campos.md", "# Campos\n");

    expect(verificarDocOmie(raiz)).toEqual([]);
  });
});

describe("células vazias", () => {
  it("acusa célula vazia em linha de tabela", () => {
    escrever(
      "t.md",
      "| Campo | Tipo |\n|---|---|\n| `codigo_produto` |  |\n"
    );

    const problemas = verificarDocOmie(raiz);

    expect(problemas).toHaveLength(1);
    expect(problemas[0].tipo).toBe("celula-vazia");
    expect(problemas[0].linha).toBe(3);
  });

  it("aceita travessão como preenchimento", () => {
    escrever(
      "t.md",
      "| Campo | Tipo |\n|---|---|\n| `codigo_produto` | — |\n"
    );

    expect(verificarDocOmie(raiz)).toEqual([]);
  });

  it("não confunde a linha separadora com célula vazia", () => {
    escrever("t.md", "| A | B |\n| --- | :---: |\n| 1 | 2 |\n");

    expect(verificarDocOmie(raiz)).toEqual([]);
  });

  it("ignora pipe dentro de bloco de código", () => {
    escrever("t.md", "```\n| isto |  | nao e tabela |\n```\n");

    expect(verificarDocOmie(raiz)).toEqual([]);
  });
});

it("devolve lista vazia quando o diretório não existe", () => {
  expect(verificarDocOmie(path.join(raiz, "inexistente"))).toEqual([]);
});
```

- [x] **Step 3: Rodar os testes e confirmar que falham**

Run: `pnpm vitest run scripts/verificar-doc-omie.test.mjs`
Expected: FAIL — `Failed to resolve import "./verificar-doc-omie.mjs"`.

- [x] **Step 4: Implementar o verificador**

Criar `scripts/verificar-doc-omie.mjs`:

```javascript
#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Valida a doc de `docs/omie-api/` contra os critérios que apodrecem sozinhos:
 * tamanho de arquivo, links relativos e células de tabela vazias. Ver
 * `docs/superpowers/specs/2026-08-10-doc-api-omie-chao-de-fabrica-design.md`.
 */

const LIMITE_DE_LINHAS = 200;

function listarMarkdown(raiz) {
  const encontrados = [];

  function varrer(diretorio) {
    for (const entrada of fs.readdirSync(diretorio, { withFileTypes: true })) {
      const completo = path.join(diretorio, entrada.name);
      if (entrada.isDirectory()) varrer(completo);
      else if (entrada.name.endsWith(".md")) encontrados.push(completo);
    }
  }

  varrer(raiz);
  return encontrados;
}

function relativo(raiz, arquivo) {
  return path.relative(raiz, arquivo).split(path.sep).join("/");
}

function verificarTamanho(raiz, arquivo, linhas, problemas) {
  if (linhas.length <= LIMITE_DE_LINHAS) return;

  problemas.push({
    arquivo: relativo(raiz, arquivo),
    linha: 0,
    tipo: "tamanho",
    mensagem: `${linhas.length} linhas, acima do limite de ${LIMITE_DE_LINHAS}`,
  });
}

function verificarLinks(raiz, arquivo, linhas, problemas) {
  const padrao = /\[[^\]]*\]\(([^)\s]+)\)/g;

  linhas.forEach((linha, indice) => {
    for (const achado of linha.matchAll(padrao)) {
      const alvo = achado[1];
      if (/^(https?:|mailto:|#)/.test(alvo)) continue;

      const semAncora = alvo.split("#")[0];
      if (semAncora === "") continue;

      const destino = path.resolve(path.dirname(arquivo), semAncora);
      if (fs.existsSync(destino)) continue;

      problemas.push({
        arquivo: relativo(raiz, arquivo),
        linha: indice + 1,
        tipo: "link",
        mensagem: `link não resolve: ${alvo}`,
      });
    }
  });
}

/** Linha só de hífens, dois-pontos e pipes — o separador de cabeçalho. */
function ehSeparadora(linha) {
  return /^\|[\s:|-]+\|$/.test(linha.trim());
}

function verificarCelulas(raiz, arquivo, linhas, problemas) {
  let dentroDeCodigo = false;

  linhas.forEach((linha, indice) => {
    const podada = linha.trim();

    if (podada.startsWith("```")) {
      dentroDeCodigo = !dentroDeCodigo;
      return;
    }
    if (dentroDeCodigo) return;
    if (!podada.startsWith("|") || !podada.endsWith("|")) return;
    if (ehSeparadora(podada)) return;

    // Preenchimentos como "—", "📖" ou "✅" passam naturalmente: só a célula
    // literalmente vazia é problema.
    const celulas = podada.slice(1, -1).split("|");
    const temVazia = celulas.some((celula) => celula.trim() === "");

    if (temVazia) {
      problemas.push({
        arquivo: relativo(raiz, arquivo),
        linha: indice + 1,
        tipo: "celula-vazia",
        mensagem: "célula vazia — use — ou uma marca de confiança",
      });
    }
  });
}

export function verificarDocOmie(raiz) {
  if (!fs.existsSync(raiz)) return [];

  const problemas = [];

  for (const arquivo of listarMarkdown(raiz)) {
    const linhas = fs.readFileSync(arquivo, "utf8").split("\n");
    // Um arquivo terminado em "\n" gera um último elemento vazio que não é linha.
    if (linhas.at(-1) === "") linhas.pop();

    verificarTamanho(raiz, arquivo, linhas, problemas);
    verificarLinks(raiz, arquivo, linhas, problemas);
    verificarCelulas(raiz, arquivo, linhas, problemas);
  }

  return problemas;
}

function principal() {
  const raiz = path.resolve(process.argv[2] ?? "docs/omie-api");
  const problemas = verificarDocOmie(raiz);

  if (problemas.length === 0) {
    console.log(`OK — doc em ${raiz} passou na verificação.`);
    return;
  }

  for (const problema of problemas) {
    const local = problema.linha > 0 ? `${problema.arquivo}:${problema.linha}` : problema.arquivo;
    console.error(`[${problema.tipo}] ${local} — ${problema.mensagem}`);
  }
  console.error(`\n${problemas.length} problema(s) encontrado(s).`);
  process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  principal();
}
```

- [x] **Step 5: Rodar os testes e confirmar que passam**

Run: `pnpm vitest run scripts/verificar-doc-omie.test.mjs`
Expected: PASS — 12 testes.

- [x] **Step 6: Registrar o script no package.json**

Em `package.json`, dentro de `"scripts"`, logo depois da linha `"skill-cache:check"`:

```json
    "verificar-doc-omie": "node scripts/verificar-doc-omie.mjs",
```

- [x] **Step 7: Confirmar que a suíte inteira continua passando**

Run: `pnpm test`
Expected: PASS — a suíte de `src/**` mais os 12 testes novos.

- [x] **Step 8: Commit**

```bash
git add scripts/verificar-doc-omie.mjs scripts/verificar-doc-omie.test.mjs vitest.config.ts package.json
git commit -m "feat: verificador da doc da API Omie (links, tamanho, celulas vazias)"
```

---

## Task 2: Índice mestre

**Files:**
- Create: `docs/omie-api/README.md`

**Interfaces:**
- Consumes: `pnpm run verificar-doc-omie` (Task 1).
- Produces: o índice que todas as tasks seguintes editam para trocar `_(pendente)_` por link. O formato de linha pendente é exatamente `| Recurso | _(pendente — fase vN)_ |` — as tasks seguintes procuram por essa string.

- [x] **Step 1: Escrever o índice**

Criar `docs/omie-api/README.md`:

````markdown
# API Omie — referência de chão de fábrica

Como obter os dados de cada endpoint da Omie, quais campos vêm de verdade, e
onde a API se comporta diferente do que documenta.

## Fronteira

Esta pasta documenta a **API da Omie**: protocolo, campos, comportamento.
[`docs/FERRAMENTAS.md`](../FERRAMENTAS.md) documenta as **ferramentas MCP**:
nome, argumentos, retorno. Não se sobrepõem — a doc da API nunca repete a
assinatura de uma tool.

[`docs/API.md`](../API.md) é o diário cronológico de achados ("em 21/07
descobrimos X"). Os arquivos `armadilhas.md` desta pasta são o estado atual
organizado por recurso, e linkam o diário como evidência.

## Marcação de confiança

Toda afirmação sobre comportamento da API carrega uma marca:

| Marca | Significa |
|---|---|
| ✅ | Observado ao vivo contra a conta real |
| 🔧 | Derivado do código que roda em produção (`src/modules/**`) |
| 📖 | Só da doc oficial da Omie — não verificado |

Nenhuma operação de escrita (`Incluir`/`Alterar`/`Excluir`) foi executada
contra a conta real. Tudo em `escrita.md` é `🔧` ou `📖`.

## Convenções (leia primeiro)

| Arquivo | Assunto |
|---|---|
| [request-auth.md](convencoes/request-auth.md) | Formato do POST, credenciais, base URL |
| [paginacao.md](convencoes/paginacao.md) | Os dois dialetos de paginação da Omie |
| [erros.md](convencoes/erros.md) | Erro em HTTP 200, rate limit, retry |
| [tipos-formatos.md](convencoes/tipos-formatos.md) | Datas, decimais, flags `"S"`/`"N"` |

## Glossário

| Arquivo | Assunto |
|---|---|
| [campos.md](glossario/campos.md) | Mesmo conceito, nome diferente por recurso |
| [conceitos.md](glossario/conceitos.md) | Malha, etapa, saldo físico × disponível |

## Recursos

| Recurso | Endpoint | Doc |
|---|---|---|
| Produtos | `geral/produtos` | _(pendente — fase v1)_ |
| Estrutura (BOM) | `geral/malha` | _(pendente — fase v1)_ |
| Estoque | `estoque/consulta`, `estoque/ajuste` | _(pendente — fase v2)_ |
| Ordem de produção | `produtos/op` | _(pendente — fase v2)_ |
| Pedido de venda | `produtos/pedido` | _(pendente — fase v3)_ |

## Integração

| Arquivo | Assunto |
|---|---|
| Modelo pro frontend | _(pendente — fase v3)_ |
| Gaps da camada própria | _(pendente — fase v3)_ |

## Escopo

**Cobre:** produtos, estrutura, estoque, ordem de produção, e a **leitura** de
pedido de venda.

**Não cobre:** emissão fiscal (NF-e, NFS-e), financeiro, compras, CRM,
serviços, e o CRUD de pedido de venda. Para esses, veja
[`docs/FERRAMENTAS.md`](../FERRAMENTAS.md).

## Manutenção

Mexeu num gateway de um dos cinco recursos, ou descobriu comportamento novo da
Omie? Atualize o arquivo correspondente **no mesmo commit**.

Antes de commitar:

```bash
pnpm run verificar-doc-omie
```

Checa links quebrados, arquivos acima de 200 linhas e células de tabela vazias.
````

- [x] **Step 2: Rodar o verificador**

Run: `pnpm run verificar-doc-omie`
Expected: FAIL — links para `convencoes/*` e `glossario/*` ainda não resolvem. Confirma que o verificador está de fato checando. Anote quantos problemas apareceram; a Task 4 zera esse número.

- [x] **Step 3: Commit**

```bash
git add docs/omie-api/README.md
git commit -m "docs: indice mestre da referencia da API Omie"
```

---

## Task 3: Convenções

Os quatro arquivos transversais. Fonte principal: `src/integrations/omie/omieClient.ts` (todo módulo passa por ele) e as diferenças de paginação entre os gateways.

**Files:**
- Create: `docs/omie-api/convencoes/request-auth.md`
- Create: `docs/omie-api/convencoes/paginacao.md`
- Create: `docs/omie-api/convencoes/erros.md`
- Create: `docs/omie-api/convencoes/tipos-formatos.md`
- Read: `src/integrations/omie/omieClient.ts`, `src/modules/produtos/infrastructure/gateways/produtos-omie-gateway.ts`, `src/modules/estrutura/infrastructure/gateways/estrutura-omie-gateway.ts`, `src/modules/estoque/infrastructure/gateways/estoque-omie-gateway.ts`

**Interfaces:**
- Consumes: índice de Task 2.
- Produces: `convencoes/paginacao.md` define os nomes **dialeto snake** e **dialeto húngaro** para os dois esquemas de paginação. Todas as tasks de recurso referenciam esses dois nomes em vez de repetir a explicação.

- [x] **Step 1: Escrever `request-auth.md`**

Conteúdo obrigatório, extraído de `omieClient.ts:20,96-106`:

- Base URL `https://app.omie.com.br/api/v1` e a montagem `{base}/{recurso}/` — **com barra final** (`omieClient.ts:99`) 🔧
- Sempre `POST`, sempre `Content-Type: application/json` 🔧
- Corpo: `{ call, app_key, app_secret, param: [ {...} ] }` — **`param` é sempre um array de um elemento** (`omieClient.ts:105`), erro clássico é mandar objeto 🔧
- Credenciais no corpo, não em header: não há `Authorization`, não há token de sessão 🔧
- Exemplo copiável completo com `ListarProdutos`
- Espaçamento mínimo de 300ms entre requisições da mesma instância (`omieClient.ts:23,172-176`) e por que existe 🔧 — linkar `erros.md`

- [x] **Step 2: Escrever `paginacao.md`**

O ponto central: **a Omie tem dois dialetos de paginação incompatíveis**, e qual usar depende do recurso. Documentar como tabela:

| Dialeto | Parâmetros de entrada | Campos de resposta | Recursos |
|---|---|---|---|
| snake | `pagina`, `registros_por_pagina` | `pagina`, `total_de_paginas`, `registros`, `total_de_registros` | `geral/produtos` 🔧, `produtos/op` 🔧, `produtos/pedido` 🔧 |
| húngaro | `nPagina`, `nRegPorPagina` | `nPagina`, `nTotPaginas`, `nRegistros`, `nTotRegistros` | `geral/malha` 🔧, `estoque/consulta` 🔧 |

Evidências: `produtos-omie-gateway.ts:32-33`, `estrutura-gateway.ts:45-51`, `estoque-omie-gateway.ts:29-39`.

Incluir também:
- O laço de paginação correto (`do/while` até `pagina > totalPaginas`), com o exemplo real de `estoque-omie-gateway.ts:41-54` 🔧
- Que o nome do array de resultados **muda por recurso** (`produto_servico_cadastro`, `produtosEncontrados`, `produtos`, `cadastros`, `pedido_venda_produto`) — tabela, com link pro `campos.md` de cada recurso 🔧
- Aviso: página vazia pode voltar como **erro**, não como lista vazia — linkar `erros.md`

- [x] **Step 3: Escrever `erros.md`**

Extraído de `omieClient.ts:52-72,129-149`:

- **Erro chega em HTTP 200.** A Omie devolve `faultstring`/`faultcode` no corpo com status 200; checar só o status HTTP é o bug mais comum 🔧 (`omieClient.ts:129-131`)
- Tabela de códigos observados:

| Código | Significa | Tratamento |
|---|---|---|
| `SOAP-ENV:Client-500` | Consumo indevido (rate limit) | Esperar e repetir 🔧 |
| `SOAP-ENV:Client-6` | Consumo redundante (chamadas próximas demais) | Esperar e repetir 🔧 |
| `SOAP-ENV:Client-5113` | Página sem registros | Tratar como lista vazia, não como erro 🔧 |
| `SOAP-ENV:Client-105` | Valor fora do enum aceito | A mensagem lista as opções válidas 🔧 |

- A mensagem às vezes diz quanto esperar (`"Aguarde 57 segundos"`) e isso deve ser respeitado 🔧 (`omieClient.ts:55-58`)
- HTTP 425 e 429 também sinalizam rate limit 🔧
- Política de retry que o repo usa: 4 tentativas, 2s para bloqueio momentâneo, backoff linear para falha de rede 🔧
- Que erro de negócio (campo obrigatório faltando) **não** é retentável — só bloqueio momentâneo é

- [x] **Step 4: Escrever `tipos-formatos.md`**

- Datas: `dd/mm/aaaa` em string, nunca ISO 🔧 (`dDtPrevisao`, `data_previsao`)
- Booleanos: string `"S"`/`"N"`, nunca `true`/`false` 🔧 (`cConcluida`, `cancelado`, `faturado`, `inativo`)
- Decimais: número JSON com ponto, não string, não vírgula 🔧
- IDs: número inteiro para código interno da Omie; string para código do usuário/integração 🔧
- Código de integração (`*_integracao`, `cCodInt*`): definido por quem integra, serve como chave alternativa em quase todo recurso 🔧 — linkar `glossario/campos.md`
- Campo ausente × `null` × `0`: por que a coluna "Sempre vem?" existe nos `campos.md`

- [x] **Step 5: Verificar tamanho e links**

Run: `pnpm run verificar-doc-omie`
Expected: os 4 arquivos de convenções não aparecem em problema de tamanho nem de célula vazia. Links pendentes para `glossario/*` e recursos ainda falham — normal nesta altura.

- [x] **Step 6: Commit**

```bash
git add docs/omie-api/convencoes/
git commit -m "docs: convencoes da API Omie (request, paginacao, erros, tipos)"
```

---

## Task 4: Glossário

**Files:**
- Create: `docs/omie-api/glossario/campos.md`
- Create: `docs/omie-api/glossario/conceitos.md`
- Read: as cinco interfaces de domínio listadas abaixo

**Interfaces:**
- Consumes: os nomes de dialeto de Task 3.
- Produces: a tabela canônica que cada `<recurso>/campos.md` referencia na coluna "Sinônimo". Colunas são adicionadas por fase — nesta task entram apenas **produtos** e **estrutura**; estoque e OP entram na v2; pedido na v3.

- [x] **Step 1: Escrever `conceitos.md`**

Um parágrafo curto por conceito, sem tabela:

- **Malha** — o nome que a Omie dá para estrutura/BOM/ficha técnica. O endpoint é `geral/malha`, e quase todo campo do recurso carrega o sufixo `Malha` 🔧. Nota: o recurso é `geral/`, não `produtos/`, apesar de ser um conceito de produto.
- **Item da malha × produto componente** — `idMalha` identifica a *linha* da estrutura; `idProdMalha` identifica o *produto* daquela linha. São coisas diferentes e ambos são exigidos em alterações 🔧 (`estrutura-gateway.ts:66-77`).
- **Etapa** — existe nos dois sentidos, e eles não têm relação:
  - Etapa de **OP** (`cEtapa`): código cru, sem endpoint de tradução. Cada conta configura de 3 a 6 etapas com nomes próprios; a API não expõe como resolver o nome 🔧 (`op-gateway.ts:12-18`).
  - Etapa de **pedido de venda** (`etapa`): catálogo fixo e documentado, resolvível por `ListarEtapasFaturamento` 🔧 (`pedido-venda-gateway.ts:96-105`).
- **Local de estoque** (`codigo_local_estoque`) — `0` significa o local padrão 🔧. Posição de estoque é sempre por local; o "total do produto" não existe na API e precisa ser somado por quem consome.
- **Saldo físico × saldo × reservado × pendente** — os quatro números que `ListarPosEstoque` devolve, e o que cada um responde 🔧 (`estoque-gateway.ts:5-16`).

- [x] **Step 2: Escrever `campos.md`**

Abrir explicando a regra: um conceito por linha, uma coluna por recurso, `—` quando o recurso não expõe o conceito. Colunas de estoque, OP e pedido chegam nas fases seguintes.

Tabela inicial (fase v1 — derivada de `produtos-gateway.ts:1-11,26-55` e `estrutura-gateway.ts:6-43`, todas 🔧):

| Conceito | produtos | estrutura |
|---|---|---|
| ID interno do produto | `codigo_produto` | `idProduto` / `idProdMalha` |
| Código do usuário (SKU) | `codigo` | `codProduto` / `codProdMalha` |
| Código de integração | `codigo_produto_integracao` | `intProduto` / `intProdMalha` |
| Descrição do produto | `descricao` | `descrProduto` / `descrProdMalha` |
| Unidade | `unidade` | `unidProduto` / `unidProdMalha` |
| ID da família | `codigo_familia` | `idFamilia` / `idFamMalha` |
| Descrição da família | `descricao_familia` | `descrFamilia` / `descrFamMalha` |
| Peso líquido | `peso_liq` | `pesoLiqProduto` / `pesoLiqProdMalha` |
| Peso bruto | `peso_bruto` | `pesoBrutoProduto` / `pesoBrutoProdMalha` |
| Quantidade | — | `quantProdMalha` |
| Código de status da resposta | `codigo_status` | `codStatus` |
| Descrição do status | `descricao_status` | `descrStatus` |

Depois da tabela, uma seção **"Padrões de renomeação"** — a parte que economiza tempo de quem integra:

1. O mesmo conceito aparece como `codigo_*` (snake, recursos `geral/produtos`, `produtos/pedido`), `n*`/`c*` (húngaro, `produtos/op`, `estoque/consulta`) e `id*`/`descr*` (camelo abreviado, `geral/malha`) 🔧
2. Prefixo húngaro indica tipo: `n` número, `c` string, `d` data 🔧
3. Em `geral/malha`, o sufixo `Malha` no campo indica que ele descreve o **item da estrutura**; sem sufixo, descreve o **produto pai** 🔧
4. Campos de status de escrita mudam de nome por recurso, mas sempre vêm em par código+descrição 🔧

- [x] **Step 3: Verificar**

Run: `pnpm run verificar-doc-omie`
Expected: nenhum problema em `convencoes/` nem `glossario/`. Os links pendentes de recursos continuam falhando — Task 5 e 6 resolvem os dois primeiros.

- [x] **Step 4: Commit**

```bash
git add docs/omie-api/glossario/
git commit -m "docs: glossario de nomenclatura divergente da API Omie"
```

---

## Task 5: Recurso Produtos

Primeiro recurso — estabelece o padrão que os outros quatro repetem.

**Files:**
- Create: `docs/omie-api/produtos/README.md`, `leitura.md`, `escrita.md`, `campos.md`, `armadilhas.md`
- Modify: `docs/omie-api/README.md` (trocar a linha `| Produtos | \`geral/produtos\` | _(pendente — fase v1)_ |`)
- Read: `src/modules/produtos/domain/interfaces/produtos-gateway.ts`, `src/modules/produtos/infrastructure/gateways/produtos-omie-gateway.ts`, `src/modules/produtos/application/use-cases/`

**Interfaces:**
- Consumes: dialeto snake (Task 3), tabela canônica (Task 4).
- Produces: o layout dos cinco arquivos que as Tasks 6, 7, 8 e 9 repetem com seu próprio conteúdo.

- [x] **Step 1: Coletar a resposta real de `ListarProdutos`**

Chamar a tool MCP `omie_produtos_listar` com a menor página possível (`pagina: 1`, `registros_por_pagina: 3`). Guardar a resposta.

Do resultado, anotar para cada campo: veio? veio vazio? veio ausente? É isso que preenche a coluna "Sempre vem?" com `✅`. Campos presentes na interface TS mas ausentes na resposta continuam `🔧`.

- [x] **Step 2: Coletar a resposta real de `ConsultarProduto`**

Chamar `omie_produtos_consultar` com o `codigo_produto` de um dos produtos do passo anterior. Anotar **quais campos existem aqui e não existem na listagem** — essa diferença é conteúdo de `armadilhas.md`.

- [x] **Step 3: Escrever `campos.md`**

Tabela da resposta de `ListarProdutos` → `produto_servico_cadastro[]`. Base derivada de `produtos-gateway.ts:1-11`; a coluna "Sempre vem?" vira `✅ sim`/`✅ não` conforme os passos 1-2:

| Campo | Tipo | Sempre vem? | Significado | Sinônimo |
|---|---|---|---|---|
| `codigo_produto` | number | 🔧 | ID interno gerado pela Omie | `idProduto` (estrutura) |
| `codigo` | string | 🔧 | SKU definido pelo usuário | `codProduto` (estrutura) |
| `codigo_produto_integracao` | string | 🔧 | Chave definida por quem integra | `intProduto` (estrutura) |
| `descricao` | string | 🔧 | Nome do produto | `descrProduto` (estrutura) |
| `unidade` | string | 🔧 | Unidade de medida (ex: `UN`) | `unidProduto` (estrutura) |
| `valor_unitario` | number | 🔧 | Preço de venda cadastrado | — |
| `inativo` | string | 🔧 | Flag `"S"`/`"N"` | — |
| `codigo_familia` | number | 🔧 | ID da família | `idFamilia` (estrutura) |
| `descricao_familia` | string | 🔧 | Nome da família | `descrFamilia` (estrutura) |

Substituir cada `🔧` da coluna "Sempre vem?" pelo resultado observado. Fechar com nota: a resposta real traz mais campos que a interface do repo modela; listar os que apareceram nos passos 1-2 e não estão acima.

- [x] **Step 4: Escrever `leitura.md`**

Dois métodos, mesmo gabarito para cada:

**`ListarProdutos`** — `POST geral/produtos/`, dialeto snake:

| Parâmetro | Tipo | Obrigatório | O que faz |
|---|---|---|---|
| `pagina` | number | sim | Página, 1-indexada 🔧 |
| `registros_por_pagina` | number | sim | Tamanho da página 🔧 |
| `apenas_importado_api` | string | sim | `"N"` — o gateway sempre envia 🔧 |
| `filtrar_apenas_omiepdv` | string | sim | `"N"` — o gateway sempre envia 🔧 |
| `filtrar_apenas_familia` | number | não | Filtra por família; omitir traz todas 🔧 |

Os dois parâmetros `"N"` são enviados incondicionalmente em produção
(`produtos-omie-gateway.ts:34-40`); confirmar ao vivo se são de fato exigidos ou
apenas defensivos, e registrar o resultado com a marca de confiança correta.

Incluir request mínimo e completo em JSON, o laço de paginação, e link para `campos.md`.

**`ConsultarProduto`** — `POST geral/produtos/`, param `{ codigo_produto }` 🔧 (`produtos-omie-gateway.ts:46-47`). Documentar que a Omie aceita chave alternativa (`codigo`, `codigo_produto_integracao`) conforme `ChaveProduto` 📖, e o que foi confirmado ao vivo.

Registrar também: para várias consultas, o repo faz N chamadas com deduplicação (`consultarProdutosPorCodigo`, `produtos-gateway.ts:70-75`) — **não existe endpoint de consulta em lote** 🔧. Linkar `90-modelo-frontend.md` como pendente da v3.

- [x] **Step 5: Escrever `escrita.md`**

Aviso no topo: não validado ao vivo nesta coleta; derivado de `DadosProdutoParaGravar` e do gateway.

Tabela de campos de `IncluirProduto`/`AlterarProduto` a partir de `produtos-gateway.ts:26-41`, com obrigatoriedade marcada `🔧` (o repo envia e funciona em produção) ou `📖`. Destacar:

- `codigo` (SKU) é **obrigatório** no `IncluirProduto`, embora a doc pública da Omie marque como opcional 🔧 (`produtos-gateway.ts:21-25`) — repetir isso em `armadilhas.md`
- `AlterarProduto` aceita chave + campos parciais 🔧
- `ExcluirProduto` recebe `ChaveProduto` 🔧

- [x] **Step 6: Escrever `armadilhas.md`**

Formato fixo por item: *o que você espera* → *o que acontece* → *como contornar* → *evidência*. Itens obrigatórios:

1. **`codigo` opcional na doc, obrigatório na prática** — evidência `src/modules/produtos/domain/interfaces/produtos-gateway.ts:21-25` 🔧
2. **Produto com qualquer ajuste de estoque nunca mais pode ser excluído** — `ExcluirProduto` recusa por dependência mesmo depois do ajuste ser excluído, porque o movimento calculado permanece. Evidência `src/modules/estoque/domain/interfaces/estoque-gateway.ts:66-72` 🔧. Linkar `../estoque/armadilhas.md` como pendente da v2.
3. **Sem consulta em lote** — enriquecer N produtos custa N chamadas, a 300ms cada. Evidência `produtos-gateway.ts:70-75` e `omieClient.ts:23` 🔧
4. **Diferença entre listagem e consulta** — os campos que só aparecem em `ConsultarProduto`, conforme observado no passo 2 ✅
5. **`quantidade_estoque` sempre vem `0`** — o campo existe em `ListarProdutos` e `ConsultarProduto` mas não é fonte confiável de estoque nesta conta; quem precisa do saldo real cruza com `estoque/consulta`. Um `0` que significa "não sei", não "zero unidades". Evidência `produtos-omie-gateway.ts:16-22` 🔧

- [x] **Step 7: Escrever `README.md` do recurso**

Curto: o que é, endpoint, tabela de métodos (`ListarProdutos`, `ConsultarProduto`, `IncluirProduto`, `AlterarProduto`, `ExcluirProduto`) com coluna de link para `leitura.md` ou `escrita.md`, e links para os outros três arquivos.

- [x] **Step 8: Atualizar o índice mestre**

Em `docs/omie-api/README.md`, trocar a linha da tabela de recursos:

```markdown
| Produtos | `geral/produtos` | [produtos/](produtos/README.md) |
```

- [x] **Step 9: Verificar**

Run: `pnpm run verificar-doc-omie`
Expected: nenhum problema em `produtos/`. Se algum arquivo passou de 200 linhas, quebrar `leitura.md` em `leitura-listar.md` e `leitura-consultar.md` e atualizar o `README.md` do recurso antes de seguir.

- [x] **Step 10: Commit**

```bash
git add docs/omie-api/produtos/ docs/omie-api/README.md
git commit -m "docs: referencia do recurso Produtos (geral/produtos)"
```

---

## Task 6: Recurso Estrutura (BOM) — fecha a v1

**Files:**
- Create: `docs/omie-api/estrutura/README.md`, `leitura.md`, `escrita.md`, `campos.md`, `armadilhas.md`
- Modify: `docs/omie-api/README.md` (linha da Estrutura)
- Read: `src/modules/estrutura/domain/interfaces/estrutura-gateway.ts`, `src/modules/estrutura/infrastructure/gateways/estrutura-omie-gateway.ts`

**Interfaces:**
- Consumes: dialeto húngaro (Task 3), glossário (Task 4), layout de Task 5.
- Produces: fecha a fase v1.

- [x] **Step 1: Coletar a resposta real de `ListarEstruturas`**

Chamar `omie_estrutura_listar` com página pequena, e `omie_estrutura_buscar_por_produto` com o `idProduto` de um produto que tenha estrutura. Anotar presença/ausência de cada campo.

- [x] **Step 2: Escrever `campos.md`**

Duas tabelas — a Omie aninha o produto pai e os itens em blocos diferentes.

Bloco `ident` (produto pai), de `estrutura-gateway.ts:25-38`:

| Campo | Tipo | Sempre vem? | Significado | Sinônimo |
|---|---|---|---|---|
| `idProduto` | number | 🔧 | ID interno do produto pai | `codigo_produto` (produtos) |
| `intProduto` | string | 🔧 | Código de integração do pai | `codigo_produto_integracao` (produtos) |
| `codProduto` | string | 🔧 | SKU do pai | `codigo` (produtos) |
| `descrProduto` | string | 🔧 | Descrição do pai | `descricao` (produtos) |
| `tipoProduto` | string | 🔧 | Tipo do item | — |
| `idFamilia` | number | 🔧 | ID da família | `codigo_familia` (produtos) |
| `codFamilia` | string | 🔧 | Código da família | — |
| `descrFamilia` | string | 🔧 | Nome da família | `descricao_familia` (produtos) |
| `unidProduto` | string | 🔧 | Unidade do pai | `unidade` (produtos) |
| `pesoLiqProduto` | number | 🔧 | Peso líquido do pai | `peso_liq` (produtos) |
| `pesoBrutoProduto` | number | 🔧 | Peso bruto do pai | `peso_bruto` (produtos) |

Bloco `itens[]` (componentes), de `estrutura-gateway.ts:6-23`:

| Campo | Tipo | Sempre vem? | Significado | Sinônimo |
|---|---|---|---|---|
| `idMalha` | number | 🔧 | ID da **linha** da estrutura | — |
| `intMalha` | string | 🔧 | Código de integração da linha | — |
| `idProdMalha` | number | 🔧 | ID do **produto componente** | `codigo_produto` (produtos) |
| `intProdMalha` | string | 🔧 | Integração do componente | `codigo_produto_integracao` (produtos) |
| `codProdMalha` | string | 🔧 | SKU do componente | `codigo` (produtos) |
| `descrProdMalha` | string | 🔧 | Descrição do componente | `descricao` (produtos) |
| `quantProdMalha` | number | 🔧 | Quantidade do componente | — |
| `unidProdMalha` | string | 🔧 | Unidade do componente | `unidade` (produtos) |
| `tipoProdMalha` | string | 🔧 | Tipo do componente | — |
| `idFamMalha` | number | 🔧 | Família do componente | `codigo_familia` (produtos) |
| `codFamMalha` | string | 🔧 | Código da família | — |
| `descrFamMalha` | string | 🔧 | Nome da família | `descricao_familia` (produtos) |
| `pesoLiqProdMalha` | number | 🔧 | Peso líquido do componente | `peso_liq` (produtos) |
| `pesoBrutoProdMalha` | number | 🔧 | Peso bruto do componente | `peso_bruto` (produtos) |
| `percPerdaProdMalha` | number | 🔧 | Percentual de perda previsto | — |
| `obsProdMalha` | string | 🔧 | Observação da linha | — |

Substituir a coluna "Sempre vem?" pelo observado. Também documentar o bloco opcional `observacoes.obsRelevantes` 🔧.

- [x] **Step 3: Escrever `leitura.md`**

**`ListarEstruturas`** — `POST geral/malha/` 🔧 (`estrutura-omie-gateway.ts:25-26`), **dialeto húngaro** (`nPagina`, `nRegPorPagina`; resposta `nPagina`/`nTotPaginas`/`nRegistros`/`nTotRegistros`, array `produtosEncontrados`) 🔧. Linkar `../convencoes/paginacao.md`.

Destacar o que economiza chamada: a estrutura **já devolve descrição, unidade e família prontas** de cada componente — diferente de `ListarOrdemProducao`, que só traz código cru 🔧 (`estrutura-gateway.ts:1-5`). Quem monta tela de ficha técnica não precisa cruzar com `geral/produtos`.

Documentar como obter a estrutura de um produto específico, conforme observado no passo 1.

- [x] **Step 4: Escrever `escrita.md`**

Aviso de não validado ao vivo. Três métodos, de `estrutura-omie-gateway.ts:39-59` e `estrutura-gateway.ts:53-99`:

- `IncluirEstrutura` — `idProduto` + `itens[]` de `ItemEstruturaParaIncluir`; `intMalha` **obrigatório** apesar da doc marcar opcional 🔧
- `AlterarEstrutura` — exige `idProdMalha` **além** de `idMalha`, mesmo para mudar só a quantidade 🔧
- `ExcluirEstrutura` — `idProduto` + `idMalha` 🔧

Resposta de incluir/alterar vem em `itemMalhaStatus[]`, uma entrada por item enviado 🔧.

- [x] **Step 5: Escrever `armadilhas.md`**

1. **Recurso é `geral/malha`, não `produtos/malha`** — o conceito é de produto, o endpoint é geral. Evidência `estrutura-omie-gateway.ts:25` 🔧
2. **Dialeto de paginação diferente do de produtos** — `nPagina`/`nRegPorPagina` em vez de `pagina`/`registros_por_pagina`; código que reusa o helper de produtos pagina errado silenciosamente. Evidência `estrutura-gateway.ts:45-51` 🔧
3. **`intMalha` obrigatório contra a doc** — e é o id do *item na malha*, não do produto componente. Evidência `estrutura-gateway.ts:53-57` 🔧
4. **Alterar exige `idProdMalha` redundante** — evidência `estrutura-gateway.ts:66-70` 🔧
5. **`idMalha` × `idProdMalha`** — confundir os dois é o erro mais provável do recurso; linkar `../glossario/conceitos.md`

- [x] **Step 6: Escrever `README.md` do recurso e atualizar o índice**

Mesmo layout de Task 5. No índice mestre:

```markdown
| Estrutura (BOM) | `geral/malha` | [estrutura/](estrutura/README.md) |
```

- [x] **Step 7: Verificar**

Run: `pnpm run verificar-doc-omie`
Expected: PASS — todos os links da v1 resolvem agora; nenhum arquivo acima de 200 linhas; nenhuma célula vazia. As linhas `_(pendente — fase v2/v3)_` não são links, então não quebram a verificação.

- [x] **Step 8: Commit**

```bash
git add docs/omie-api/estrutura/ docs/omie-api/README.md
git commit -m "docs: referencia do recurso Estrutura/BOM (geral/malha) - fecha v1"
```

---

## Task 7: Recurso Estoque

**Files:**
- Create: `docs/omie-api/estoque/README.md`, `leitura.md`, `escrita.md`, `campos.md`, `armadilhas.md`
- Modify: `docs/omie-api/README.md` (linha do Estoque), `docs/omie-api/glossario/campos.md` (coluna nova)
- Read: `src/modules/estoque/domain/interfaces/estoque-gateway.ts`, `src/modules/estoque/infrastructure/gateways/estoque-omie-gateway.ts`

**Interfaces:**
- Consumes: dialeto húngaro (Task 3), layout de Task 5.
- Produces: coluna `estoque` no glossário.

- [ ] **Step 1: Coletar a resposta real**

Chamar `omie_estoque_total_produto` para um produto conhecido e `omie_estoque_movimentos_listar` com janela curta. Anotar presença de cada campo.

- [ ] **Step 2: Escrever `campos.md`**

De `estoque-gateway.ts:5-16` — resposta de `ListarPosEstoque` → `produtos[]`:

| Campo | Tipo | Sempre vem? | Significado | Sinônimo |
|---|---|---|---|---|
| `nCodProd` | number | 🔧 | ID interno do produto | `codigo_produto` (produtos) |
| `cCodigo` | string | 🔧 | SKU do produto | `codigo` (produtos) |
| `cDescricao` | string | 🔧 | Descrição do produto | `descricao` (produtos) |
| `codigo_local_estoque` | number | 🔧 | Local de estoque; `0` = padrão | — |
| `fisico` | number | 🔧 | Saldo físico no local | — |
| `nSaldo` | number | 🔧 | Saldo disponível | — |
| `reservado` | number | 🔧 | Quantidade reservada | — |
| `nPendente` | number | 🔧 | Quantidade pendente | — |
| `nCMC` | number | 🔧 | Custo médio no local | — |

Nota obrigatória: `fisico`, `nSaldo`, `reservado` e `nPendente` respondem perguntas diferentes; linkar `../glossario/conceitos.md`.

- [ ] **Step 3: Escrever `leitura.md`**

**`ListarPosEstoque`** — `POST estoque/consulta/` 🔧, dialeto húngaro, param `{ nPagina, nRegPorPagina, codigo_local_estoque }` 🔧 (`estoque-omie-gateway.ts:29-39`).

O ponto mais importante do recurso: **não existe filtro por produto**. Para saber o estoque de um produto, é preciso varrer todas as páginas e filtrar em memória 🔧 (`estoque-omie-gateway.ts:20-24,56-59`). Documentar o custo disso e apontar `../91-gaps-camada-propria.md` (pendente da v3) — é exatamente o tipo de caso em que a camada própria vale mais que a Omie direta.

Documentar `codigo_local_estoque: 0` como "todos/padrão" conforme o gateway usa 🔧, e o tamanho de página de 500 que o repo adota 🔧.

- [ ] **Step 4: Escrever `escrita.md`**

Aviso de não validado ao vivo. `IncluirAjusteEstoque` / `ExcluirAjusteEstoque` em `estoque/ajuste` 🔧, campos de `DadosAjusteEstoqueParaGravar` (`estoque-gateway.ts:26-37`).

Tabela dos enums, que a doc pública não documenta 🔧:

| Campo | Valores aceitos | Significado |
|---|---|---|
| `tipo` | `ENT`, `SAI`, `SLD`, `TRF` | Entrada, saída, saldo, transferência |
| `origem` | `AJU`, `PDV` | Ajuste, ponto de venda |
| `motivo` | `INI`, `INV`, `OPE`, `PDV` | Estoque inicial, inventário, operacional, PDV |

Evidência do enum de `motivo`: `estoque-gateway.ts:18-24` — descoberto pelo erro `SOAP-ENV:Client-105`, que lista as opções válidas na mensagem 🔧.

- [ ] **Step 5: Escrever `armadilhas.md`**

1. **Não existe endpoint de estoque total por produto** — só posição por local, paginada, sem filtro. Evidência `estoque-omie-gateway.ts:20-24` 🔧
2. **Ajuste é irreversível na prática** — a Omie exclui o ajuste, mas o movimento calculado fica no produto para sempre; depois de qualquer ajuste o produto **nunca mais** pode ser excluído. Evidência `estoque-gateway.ts:66-72` 🔧. Linkar `../produtos/armadilhas.md`.
3. **Dialeto húngaro com nome próprio** — `nRegPorPagina`, não `nRegistrosPorPagina` nem `registros_por_pagina`. Evidência `estoque-omie-gateway.ts:34-35` 🔧
4. **Enum de `motivo` só descobrível pelo erro** — evidência `estoque-gateway.ts:18-24` 🔧

- [ ] **Step 6: Adicionar a coluna `estoque` ao glossário**

Em `docs/omie-api/glossario/campos.md`, acrescentar a coluna preenchendo as linhas existentes (`—` onde não se aplica):

| Conceito | estoque |
|---|---|
| ID interno do produto | `nCodProd` |
| Código do usuário (SKU) | `cCodigo` |
| Descrição do produto | `cDescricao` |
| Quantidade | `fisico` / `nSaldo` |
| Código de status da resposta | `codigo_status` |
| Descrição do status | `descricao_status` |

Demais conceitos: `—`.

- [ ] **Step 7: `README.md` do recurso, índice mestre, verificar, commit**

Índice mestre:

```markdown
| Estoque | `estoque/consulta`, `estoque/ajuste` | [estoque/](estoque/README.md) |
```

Run: `pnpm run verificar-doc-omie` → Expected: PASS.

```bash
git add docs/omie-api/estoque/ docs/omie-api/README.md docs/omie-api/glossario/campos.md
git commit -m "docs: referencia do recurso Estoque (consulta + ajuste)"
```

---

## Task 8: Recurso Ordem de Produção — fecha a v2

**Files:**
- Create: `docs/omie-api/ordem-producao/README.md`, `leitura.md`, `escrita.md`, `campos.md`, `armadilhas.md`
- Modify: `docs/omie-api/README.md`, `docs/omie-api/glossario/campos.md`
- Read: `src/modules/ordemProducao/domain/interfaces/op-gateway.ts`, `src/modules/ordemProducao/infrastructure/gateways/op-omie-gateway.ts`, `src/modules/ordemProducao/application/dto/listar-ops-com-produto.dto.ts`

**Interfaces:**
- Consumes: dialeto snake (Task 3), produtos (Task 5), estrutura (Task 6).
- Produces: coluna `ordem-producao` no glossário; fecha a fase v2.

- [ ] **Step 1: Coletar a resposta real**

Chamar `omie_op_listar` com página pequena e `omie_op_consultar` com um `nCodOP` do resultado. Anotar quais blocos vêm sempre (`identificacao`, `infAdicionais`, `outrasInf`) e se `observacoes`/`itensDetalhes` aparecem — esses dois são opcionais na interface 🔧 (`op-gateway.ts:65-73`).

- [ ] **Step 2: Escrever `campos.md`**

Uma tabela por bloco, de `op-gateway.ts:1-28,65-73`.

`identificacao`:

| Campo | Tipo | Sempre vem? | Significado | Sinônimo |
|---|---|---|---|---|
| `nCodOP` | number | 🔧 | ID interno da OP | — |
| `cCodIntOP` | string | 🔧 | Código de integração da OP | — |
| `cNumOP` | string | 🔧 | Número visível da OP | — |
| `nCodProduto` | number | 🔧 | Produto a produzir | `codigo_produto` (produtos) |
| `nQtde` | number | 🔧 | Quantidade planejada | `quantidade` (pedido) |
| `dDtPrevisao` | string | 🔧 | Data prevista, `dd/mm/aaaa` | — |
| `codigo_local_estoque` | number | 🔧 | Local de estoque; `0` = padrão | — |

`infAdicionais`:

| Campo | Tipo | Sempre vem? | Significado | Sinônimo |
|---|---|---|---|---|
| `cEtapa` | string | 🔧 | Código cru da etapa no kanban | — |
| `dDtInicio` | string | 🔧 | Data de início | — |
| `dDtConclusao` | string | 🔧 | Data de conclusão prevista | — |
| `nCodProjeto` | number | 🔧 | Projeto vinculado | — |

`outrasInf`:

| Campo | Tipo | Sempre vem? | Significado | Sinônimo |
|---|---|---|---|---|
| `cConcluida` | string | 🔧 | Flag `"S"`/`"N"` | — |
| `dInclusao` | string | 🔧 | Data de inclusão | — |
| `dConclusao` | string | 🔧 | Data de conclusão efetiva | — |

Só em `ConsultarOrdemProducao` 🔧: `observacoes.cObs`, e `itensDetalhes[]` com `nIdProdutoMalha`, `nQtde`, `codigo_local_estoque`, `cObs`. Marcar conforme observado no passo 1.

- [ ] **Step 3: Escrever `leitura.md`**

**`ListarOrdemProducao`** — `POST produtos/op/` 🔧, dialeto snake, param `{ pagina, registros_por_pagina }`, array de resposta `cadastros` 🔧 (`op-omie-gateway.ts:16-25`).

Destacar: a listagem **só traz `nCodProduto` cru**, sem descrição — para montar tela é preciso cruzar com `geral/produtos`, e não há consulta em lote 🔧. Linkar `../produtos/leitura.md` e `../90-modelo-frontend.md` (pendente da v3).

**`ConsultarOrdemProducao`** — param é a chave direto na raiz (`{ nCodOP }` ou `{ cCodIntOP }`) 🔧 (`op-omie-gateway.ts:27-33`).

- [ ] **Step 4: Escrever `escrita.md`**

Aviso de não validado ao vivo. De `op-omie-gateway.ts:35-57` e `op-gateway.ts:38-63`:

- `IncluirOrdemProducao`/`AlterarOrdemProducao` exigem os campos dentro de um wrapper **`identificacao`** 🔧 — `ConsultarOrdemProducao`/`ExcluirOrdemProducao` não usam wrapper, vão na raiz. Assimetria própria do recurso.
- `codigo_local_estoque` é obrigatório mesmo na inclusão simples (`0` = padrão) 🔧
- O produto precisa **já ter estrutura (BOM) cadastrada**, senão a Omie recusa 🔧 (`op-gateway.ts:38-42`) — linkar `../estrutura/README.md`
- Resposta em `StatusOPOmie`: `nCodOP`, `cCodIntOP`, `cCodStatus`, `cDesStatus` 🔧

- [ ] **Step 5: Escrever `armadilhas.md`**

1. **`cEtapa` não é traduzível pela API** — código cru; cada conta configura de 3 a 6 etapas com nomes próprios e não há endpoint para resolver o nome. Ao contrário do pedido de venda, que tem catálogo. Evidência `op-gateway.ts:12-18` 🔧. Linkar `../pedido-venda/armadilhas.md` (pendente da v3).
2. **Wrapper `identificacao` só na escrita** — evidência `op-omie-gateway.ts:39,47` × `:31,55` 🔧
3. **OP exige estrutura prévia** — evidência `op-gateway.ts:38-42` 🔧
4. **Listagem sem descrição de produto** — N+1 chamadas para montar tela. Evidência `op-omie-gateway.ts:16-25` 🔧

- [ ] **Step 6: Adicionar a coluna `ordem-producao` ao glossário**

| Conceito | ordem-producao |
|---|---|
| ID interno do produto | `nCodProduto` |
| Código de integração | `cCodIntOP` (da OP, não do produto) |
| Quantidade | `nQtde` |
| Código de status da resposta | `cCodStatus` |
| Descrição do status | `cDesStatus` |

Demais conceitos: `—`. A observação entre parênteses na linha de integração é obrigatória — é justamente o tipo de confusão que o glossário existe para evitar.

- [ ] **Step 7: `README.md` do recurso, índice mestre, verificar, commit**

```markdown
| Ordem de produção | `produtos/op` | [ordem-producao/](ordem-producao/README.md) |
```

Run: `pnpm run verificar-doc-omie` → Expected: PASS.

```bash
git add docs/omie-api/ordem-producao/ docs/omie-api/README.md docs/omie-api/glossario/campos.md
git commit -m "docs: referencia do recurso Ordem de Producao - fecha v2"
```

---

## Task 9: Recurso Pedido de Venda (leitura)

**Files:**
- Create: `docs/omie-api/pedido-venda/README.md`, `leitura.md`, `escrita.md`, `campos.md`, `armadilhas.md`
- Modify: `docs/omie-api/README.md`, `docs/omie-api/glossario/campos.md`
- Read: `src/modules/pedidoVenda/domain/interfaces/pedido-venda-gateway.ts`, `src/modules/pedidoVenda/infrastructure/gateways/pedido-venda-omie-gateway.ts`

**Interfaces:**
- Consumes: dialeto snake (Task 3), produtos (Task 5).
- Produces: coluna `pedido-venda` no glossário.

- [ ] **Step 1: Coletar a resposta real**

Chamar `omie_pedido_venda_listar` (página pequena), `omie_pedido_venda_etapas_listar`, e `omie_pedido_venda_consultar` com um `codigo_pedido` do resultado. Guardar o catálogo de etapas — ele vira tabela na doc.

- [ ] **Step 2: Escrever `campos.md`**

Por bloco, de `pedido-venda-gateway.ts:1-30`.

`cabecalho`:

| Campo | Tipo | Sempre vem? | Significado | Sinônimo |
|---|---|---|---|---|
| `codigo_pedido` | number | 🔧 | ID interno do pedido | — |
| `numero_pedido` | string | 🔧 | Número visível | — |
| `codigo_cliente` | number | 🔧 | ID do cliente | — |
| `data_previsao` | string | 🔧 | Data prevista, `dd/mm/aaaa` | — |
| `etapa` | string | 🔧 | Código da etapa de faturamento | `cEtapa` (OP, sem catálogo) |
| `quantidade_itens` | number | 🔧 | Contagem de itens | — |

`det[].produto`:

| Campo | Tipo | Sempre vem? | Significado | Sinônimo |
|---|---|---|---|---|
| `codigo_produto` | number | 🔧 | ID interno do produto | `nCodProduto` (OP) |
| `codigo` | string | 🔧 | SKU | `cCodigo` (estoque) |
| `descricao` | string | 🔧 | Descrição | `cDescricao` (estoque) |
| `unidade` | string | 🔧 | Unidade | `unidProdMalha` (estrutura) |
| `quantidade` | number | 🔧 | Quantidade pedida | `nQtde` (OP) |
| `valor_unitario` | number | 🔧 | Preço unitário | — |
| `valor_mercadoria` | number | 🔧 | Total da linha | — |

`infoCadastro`: `cancelado` e `faturado`, ambos `"S"`/`"N"` 🔧. `total_pedido.valor_total_pedido` 🔧.

Tabela à parte com o catálogo de etapas coletado no passo 1 (`cCodigo` → `cDescricao`), marcada `✅`.

- [ ] **Step 3: Escrever `leitura.md`**

**`ListarPedidos`** — `POST produtos/pedido/` 🔧, dialeto snake, array `pedido_venda_produto` 🔧, filtro opcional por `etapa` 🔧 (`pedido-venda-omie-gateway.ts:33-34`).

**`ListarEtapasFaturamento`** — recurso **diferente**: `produtos/etapafat` 🔧 (`pedido-venda-omie-gateway.ts:46-47`). Devolve etapas agrupadas por operação; a operação "Venda de Produto" é o código fixo `"11"` 🔧 (`pedido-venda-gateway.ts:53-54`). Documentar que resolver o nome da etapa exige essa segunda chamada, em outro endpoint.

**`ConsultarPedido`** — `produtos/pedido`, chave `codigo_pedido` ou `codigo_pedido_integracao` 🔧.

- [ ] **Step 4: Escrever `escrita.md`**

Aviso duplo no topo: **fora do escopo desta doc** (só a leitura de pedido foi documentada) e não validado ao vivo. Registrar apenas o essencial, de `pedido-venda-gateway.ts:63-88`:

- `IncluirPedido`, `AlterarPedidoVenda`, `ExcluirPedido` 🔧
- O cliente precisa ter **UF preenchida** no cadastro 🔧
- `codigo_categoria` e `codigo_conta_corrente` são obrigatórios mesmo num pedido simples 🔧

Encerrar apontando `../../FERRAMENTAS.md` para quem precisa do CRUD completo.

- [ ] **Step 5: Escrever `armadilhas.md`**

1. **`AlterarPedidoVenda` foge do padrão** — os outros métodos do recurso são `IncluirPedido`/`ExcluirPedido`/`ConsultarPedido`, mas o de alteração é `AlterarPedidoVenda`. Evidência `pedido-venda-omie-gateway.ts:108,116,124` 🔧
2. **Pedido cancelado mantém a etapa antiga** — o cancelamento não reseta `etapa`; filtrar por etapa sem cruzar com `infoCadastro.cancelado` traz pedido cancelado como se estivesse ativo. Evidência `pedido-venda-gateway.ts:101-105` 🔧
3. **Resolver etapa exige outro endpoint** — `produtos/etapafat`, com o código de operação fixo `"11"` para venda de produto. Evidência `pedido-venda-gateway.ts:53-54` 🔧
4. **Etapa de pedido × etapa de OP** — mesmo nome, naturezas opostas: a do pedido tem catálogo, a da OP não. Evidência `pedido-venda-gateway.ts:96-100` e `op-gateway.ts:12-18` 🔧. Linkar `../ordem-producao/armadilhas.md`.

- [ ] **Step 6: Adicionar a coluna `pedido-venda` ao glossário**

| Conceito | pedido-venda |
|---|---|
| ID interno do produto | `codigo_produto` |
| Código do usuário (SKU) | `codigo` |
| Código de integração | `codigo_pedido_integracao` (do pedido) |
| Descrição do produto | `descricao` |
| Unidade | `unidade` |
| Quantidade | `quantidade` |
| Código de status da resposta | `codigo_status` |
| Descrição do status | `descricao_status` |

Demais conceitos: `—`.

- [ ] **Step 7: `README.md` do recurso, índice mestre, verificar, commit**

```markdown
| Pedido de venda | `produtos/pedido` | [pedido-venda/](pedido-venda/README.md) |
```

Run: `pnpm run verificar-doc-omie` → Expected: PASS.

```bash
git add docs/omie-api/pedido-venda/ docs/omie-api/README.md docs/omie-api/glossario/campos.md
git commit -m "docs: referencia do recurso Pedido de Venda (leitura)"
```

---

## Task 10: Modelo para o frontend

**Files:**
- Create: `docs/omie-api/90-modelo-frontend.md`
- Modify: `docs/omie-api/README.md` (tabela "Integração")

**Interfaces:**
- Consumes: os cinco recursos (Tasks 5-9).
- Produces: as receitas que `91-gaps-camada-propria.md` referencia.

- [ ] **Step 1: Escrever as três receitas**

Formato fixo por receita: *pergunta* → *sequência de chamadas* → *custo em chamadas* → *shape agregado sugerido*.

**Receita 1 — listar OPs abertas com nome do produto.** `ListarOrdemProducao` paginado, coletar os `nCodProduto` distintos, `ConsultarProduto` para cada um (não há lote), montar o cruzamento. Custo: 1 chamada por página + 1 por produto distinto, a 300ms cada. Shape sugerido em JSON, com campos já renomeados para nomes estáveis (`produtoId`, `produtoDescricao`, `quantidade`, `dataPrevisao`, `etapaCodigo`), e nota de que `etapaCodigo` não é traduzível — linkar `ordem-producao/armadilhas.md`.

**Receita 2 — saldo de insumo para uma OP.** `ConsultarOrdemProducao` → `ListarEstruturas`/busca por produto para os componentes → `ListarPosEstoque` varrendo tudo e filtrando em memória (não há filtro por produto). Custo: alto, dominado pela varredura de estoque. Shape sugerido, com `faltante` calculado por componente.

**Receita 3 — pedidos pendentes de separação.** `ListarPedidos` filtrando por etapa → `ListarEtapasFaturamento` (operação `"11"`) para resolver o nome → descartar os `cancelado === "S"`. Custo: 1 chamada de catálogo + N páginas. Shape sugerido.

- [ ] **Step 2: Escrever a seção "Regras de shape"**

Recomendações transversais para quem desenha o contrato do front, cada uma com o motivo:

- Renomear para nomes estáveis na borda, nunca propagar `nCodProduto`/`codigo_produto`/`nCodProd` para dentro do app — linkar `glossario/campos.md`
- Converter `"S"`/`"N"` para booleano e `dd/mm/aaaa` para ISO na borda — linkar `convencoes/tipos-formatos.md`
- Nunca paginar no front: a Omie não tem filtro suficiente para isso; agregue no servidor
- Tratar campo ausente e `0` como coisas diferentes — linkar as colunas "Sempre vem?"

- [ ] **Step 3: Atualizar o índice e verificar**

```markdown
| [Modelo pro frontend](90-modelo-frontend.md) | Receitas de cruzamento e shape agregado |
```

Run: `pnpm run verificar-doc-omie` → Expected: PASS. Se o arquivo passou de 200 linhas, quebrar por receita (`90-modelo-frontend.md` vira índice; cada receita ganha arquivo próprio).

- [ ] **Step 4: Commit**

```bash
git add docs/omie-api/90-modelo-frontend.md docs/omie-api/README.md
git commit -m "docs: modelo de dados para o frontend (receitas de cruzamento)"
```

---

## Task 11: Gaps da camada própria — fecha a v3

**Files:**
- Create: `docs/omie-api/91-gaps-camada-propria.md`
- Modify: `docs/omie-api/README.md` (tabela "Integração")
- Read: `src/httpServer.ts`, `src/tools/registry.ts`, `packages/omie-data/CONTEXT.md`, `packages/omie-data/src/modules/`

**Interfaces:**
- Consumes: receitas de Task 10.
- Produces: fecha a fase v3 e o plano.

- [ ] **Step 1: Levantar o que a camada própria cobre**

Ler `src/tools/registry.ts` para as tools dos cinco recursos, e `packages/omie-data/src/modules/` para saber quais têm cache (hoje: produtos, estoque, ordem de produção — confirmar). Anotar, por necessidade, se existe cobertura.

- [ ] **Step 2: Escrever a tabela de decisão**

Uma linha por necessidade, três colunas de veredito:

| Necessidade | `httpServer` (MCP) | `omie-data` (cache) | Veredito |
|---|---|---|---|

Preencher com o levantamento do passo 1. A coluna "Veredito" diz uma de três coisas, sempre com a razão: *usar a camada própria*, *chamar a Omie direto*, ou *precisa de trabalho novo na camada própria*.

Necessidades a cobrir, no mínimo: listar produtos; consultar produto; ficha técnica de um produto; posição de estoque de um produto; listar OPs com descrição de produto; listar pedidos por etapa; pedidos pendentes de separação.

- [ ] **Step 3: Escrever a seção "Por que a camada própria ganha"**

Os três casos em que chamar a Omie direto é ruim, cada um linkando a armadilha que o comprova:

1. Estoque por produto — a Omie obriga a varrer tudo; o cache resolve em uma consulta local (`estoque/armadilhas.md`)
2. OP com descrição de produto — N+1 chamadas a 300ms; o cache já traz cruzado (`ordem-producao/armadilhas.md`)
3. Qualquer tela que releia o mesmo dado — cada releitura é uma chamada nova, com risco de "consumo redundante" (`convencoes/erros.md`)

E o caso oposto, honesto: quando o dado precisa estar quente (etapa de OP que acabou de mudar no chão de fábrica), o cache atrapalha e a Omie direta é a resposta certa.

- [ ] **Step 4: Atualizar o índice e a nota de escopo**

```markdown
| [Gaps da camada própria](91-gaps-camada-propria.md) | httpServer/omie-data × Omie direto |
```

Conferir que nenhuma linha `_(pendente — fase vN)_` sobrou no `docs/omie-api/README.md`.

- [ ] **Step 5: Verificação final**

Run: `pnpm run verificar-doc-omie`
Expected: PASS, sem nenhum problema.

Run: `pnpm test`
Expected: PASS.

Conferir manualmente os seis critérios de pronto da spec: método de gateway coberto, sem `TBD`, armadilha com evidência, nada acima de 200 linhas, verificador passa, marca de confiança em toda afirmação.

- [ ] **Step 6: Commit**

```bash
git add docs/omie-api/91-gaps-camada-propria.md docs/omie-api/README.md
git commit -m "docs: gaps da camada propria vs Omie direto - fecha v3"
```
