# omie-data — Módulo de Estoque Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganizar o pacote `omie-data` para estrutura modular (`src/modules/<modulo>/`) e adicionar o módulo de Estoque, enriquecendo `view_produtos` com quantidade e valor em estoque, conforme `docs/superpowers/specs/2026-08-06-estoque-omie-data-design.md`.

**Architecture:** Dois commits. Commit 1: reorganização estrutural (mover Produtos, split de interfaces HTTP) — zero mudança de comportamento. Commit 2: módulo de estoque (`collectEstoque`, `raw_estoque`, join na tradução, novas colunas em `view_produtos`).

**Tech Stack:** TypeScript, Vitest, better-sqlite3, Node `fetch` nativo.

## Global Constraints

- TDD sempre: teste que falha → confirma falha → implementa → confirma passa → commit.
- Um commit por task concluída.
- `rodarProdutos` coleta estoque **antes** da tradução (a tradução faz join com `raw_estoque`).
- `translateProdutos` nunca chama a rede — só lê os raw e escreve a view.
- `collectEstoque` nunca traduz — só grava o payload bruto.
- Sem alteração no servidor MCP (`src/modules/estoque/`).
- Build (`npm run build`) + suíte completa (`npm test`) antes de cada commit.
- Instalar dependências sempre com `npm --prefix packages/omie-data install` (cwd dentro do pacote, senão npm reintroduz `omie-mcp:file:../..` no package.json — bug conhecido).

---

## Commit 1: Reorganização estrutural

### Task 1: Split das interfaces HTTP + mover domínio de produtos

**Files:**
- Create: `packages/omie-data/src/domain/produtos-http-client.ts`
- Create: `packages/omie-data/src/domain/estoque-http-client.ts`
- Create: `packages/omie-data/src/modules/produtos/domain/produto.ts`
- Delete: `packages/omie-data/src/domain/omie-http-client.ts`
- Delete: `packages/omie-data/src/domain/produto.ts`
- Update: imports em todos os arquivos que referenciam os paths antigos

**What changes:**
- `domain/produto.ts` → `modules/produtos/domain/produto.ts` (interfaces `ProdutoOmieBruto`, `ProdutoView`)
- `domain/omie-http-client.ts` split em:
  - `domain/produtos-http-client.ts`: `IProdutosHttpClient`, `ListarProdutosResponseBruto`
  - `domain/estoque-http-client.ts`: `IEstoqueHttpClient` (interface vazia por enquanto, placeholder pra commit 2), `ListarPosEstoqueResponseBruto` (também placeholder)
- `fake-omie-http-client.ts` → renomear para `fake-http-client.ts`, implementar `IProdutosHttpClient`
- `omie-http-client-real.ts` → renomear para `http-client-real.ts`, implementar `IProdutosHttpClient`
- Atualizar imports em: `collect-produtos.ts`, `translate-produtos.ts`, `consultar-produtos.ts`, `rodar-produtos.ts`, `rodar-configurar.ts`, `cli.ts` + todos os `.test.ts`

**Test strategy:** Não há teste novo — o teste é a suíte existente continuar passando após cada movimento. Rodar `npm test` + `npm run build` ao final.

- [ ] **Step 1: Criar `modules/produtos/domain/produto.ts` (cópia exata de `domain/produto.ts`)**

```typescript
/** Payload bruto de um produto, como a API Omie devolve em ListarProdutos/ConsultarProduto. */
export interface ProdutoOmieBruto {
  codigo_produto: number;
  codigo: string;
  descricao: string;
  unidade: string;
  valor_unitario: number;
  inativo: string; // "S" | "N"
  codigo_familia: number;
  descricao_familia?: string;
}

/** Produto já traduzido/legível, pronto pra apresentar ao usuário. */
export interface ProdutoView {
  codigoProduto: number;
  codigo: string;
  nome: string;
  categoria: string;
  unidade: string;
  valorFormatado: string;
  ativo: "Sim" | "Não";
}
```

- [ ] **Step 2: Criar `domain/produtos-http-client.ts`**

```typescript
import { ProdutoOmieBruto } from "../modules/produtos/domain/produto.js";

export interface ListarProdutosResponseBruto {
  pagina: number;
  total_de_paginas: number;
  produto_servico_cadastro: ProdutoOmieBruto[];
}

export interface IProdutosHttpClient {
  listarProdutosPagina(
    pagina: number,
    registrosPorPagina: number
  ): Promise<ListarProdutosResponseBruto>;
}
```

- [ ] **Step 3: Criar `domain/estoque-http-client.ts` (placeholder)**

```typescript
/**
 * Interface do cliente HTTP de estoque.
 * Placeholder — os métodos reais entram no Commit 2 (Task 5).
 */
export interface IEstoqueHttpClient {
  // métodos virão no commit 2
}
```

- [ ] **Step 4: Atualizar `fake-omie-http-client.ts` → renomear e adaptar**

Renomear para `fake-http-client.ts`. A classe `FakeHttpClient` implementa `IProdutosHttpClient`. Mesmo comportamento de antes.

- [ ] **Step 5: Atualizar `omie-http-client-real.ts` → renomear e adaptar**

Renomear para `http-client-real.ts`. A classe `OmieHttpClientReal` implementa `IProdutosHttpClient`. Mesmo comportamento de antes.

- [ ] **Step 6: Atualizar imports em todos os arquivos de application**

Atualizar `collect-produtos.ts`, `translate-produtos.ts`, `consultar-produtos.ts`, `rodar-produtos.ts`, `rodar-configurar.ts`, `cli.ts` e seus respectivos `.test.ts` para importar dos novos paths.

- [ ] **Step 7: Atualizar `cli.ts` — imports**

`cli.ts` importa de `./domain/omie-http-client.js`, `./infrastructure/omie-http-client-real.js`, `./infrastructure/fake-omie-http-client.js` — atualizar para os novos paths.

- [ ] **Step 8: Rodar suíte completa**

Run: `npm --prefix packages/omie-data test`
Expected: todos os ~65 testes PASS (zero quebra).

- [ ] **Step 9: Rodar build**

Run: `npm --prefix packages/omie-data run build`
Expected: build sem erros.

- [ ] **Step 10: Remover `domain/omie-http-client.ts` e `domain/produto.ts` antigos**

- [ ] **Step 11: Rodar suíte + build de novo e commit**

```bash
git add packages/omie-data/src/
git rm packages/omie-data/src/domain/omie-http-client.ts packages/omie-data/src/domain/produto.ts
git commit -m "refactor(omie-data): reorganização modular — Produtos para modules/produtos/, split IProdutosHttpClient/IEstoqueHttpClient"
```

---

### Task 2: Mover application de produtos para `modules/produtos/application/`

**Files:**
- Move: `application/collect-produtos.ts` → `modules/produtos/application/collect-produtos.ts`
- Move: `application/collect-produtos.test.ts` → `modules/produtos/application/collect-produtos.test.ts`
- Move: `application/translate-produtos.ts` → `modules/produtos/application/translate-produtos.ts`
- Move: `application/translate-produtos.test.ts` → `modules/produtos/application/translate-produtos.test.ts`
- Move: `application/consultar-produtos.ts` → `modules/produtos/application/consultar-produtos.ts`
- Move: `application/consultar-produtos.test.ts` → `modules/produtos/application/consultar-produtos.test.ts`
- Move: `application/rodar-produtos.ts` → `modules/produtos/application/rodar-produtos.ts`
- Move: `application/rodar-produtos.test.ts` → `modules/produtos/application/rodar-produtos.test.ts`
- Move: `application/rodar-ajuda-interativo.ts` → `modules/produtos/application/rodar-ajuda-interativo.ts`
- Move: `application/rodar-ajuda-interativo.test.ts` → `modules/produtos/application/rodar-ajuda-interativo.test.ts`
- Update: imports em `cli.ts`, `rodar-configurar.ts`, `rodar-menu-principal.ts` e seus testes

**Test strategy:** Mover arquivos, atualizar imports internos (referências entre application files), atualizar imports em `cli.ts` e `infrastructure/`. Rodar suíte completa.

- [ ] **Step 1: Criar diretório `modules/produtos/application/`**

- [ ] **Step 2: Mover os 10 arquivos (5 source + 5 test) para `modules/produtos/application/`**

- [ ] **Step 3: Atualizar imports internos entre os arquivos movidos**

Ex: `collect-produtos.ts` importava de `../domain/omie-http-client.js` → agora importa de `../../../domain/produtos-http-client.js`.
Ex: `translate-produtos.ts` importava de `../domain/produto.js` → agora importa de `../domain/produto.js` (mesmo módulo).

- [ ] **Step 4: Atualizar imports em `cli.ts`**

`cli.ts` importa de `./application/rodar-produtos.js`, `./application/rodar-ajuda-interativo.js`, etc. → atualizar para `./modules/produtos/application/...`.

- [ ] **Step 5: Atualizar imports em `rodar-menu-principal.ts`**

- [ ] **Step 6: Atualizar imports nos arquivos de teste de `cli.ts`, `rodar-menu-principal.ts`, `rodar-configurar.ts`**

- [ ] **Step 7: Rodar suíte completa**

Run: `npm --prefix packages/omie-data test`
Expected: todos os ~65 testes PASS.

- [ ] **Step 8: Rodar build**

Run: `npm --prefix packages/omie-data run build`
Expected: build sem erros.

- [ ] **Step 9: Commit**

```bash
git add packages/omie-data/src/
git commit -m "refactor(omie-data): mover application de produtos para modules/produtos/application/"
```

---

### Task 3: Atualizar `database.ts` — adicionar `raw_estoque` + novas colunas em `view_produtos`

**Files:**
- Update: `packages/omie-data/src/infrastructure/database.ts`
- Update: `packages/omie-data/src/infrastructure/database.test.ts`

**What changes:**
- `raw_estoque` table: `codigo_produto INTEGER, codigo_local_estoque INTEGER, payload_json TEXT NOT NULL, coletado_em TEXT NOT NULL, PRIMARY KEY (codigo_produto, codigo_local_estoque)`
- `view_produtos` ganha 3 colunas: `quantidade_em_estoque REAL NOT NULL DEFAULT 0`, `valor_em_estoque_custo REAL NOT NULL DEFAULT 0`, `valor_em_estoque_venda REAL NOT NULL DEFAULT 0`

**Importante:** SQLite não suporta `ALTER TABLE ADD COLUMN IF NOT EXISTS`. Como o banco é recriado do zero em teste (`:memory:`) e em produção o `CREATE TABLE IF NOT EXISTS` com as colunas novas resolve pra bancos novos, precisamos tratar a migração de bancos existentes. Estratégia: tentar `ALTER TABLE ADD COLUMN` dentro de try/catch — se a coluna já existir, ignora o erro.

- [ ] **Step 1: Atualizar o teste `database.test.ts`**

Adicionar asserts para `raw_estoque` e novas colunas de `view_produtos`:

```typescript
it("cria a tabela raw_estoque com PK composta", () => {
  const db = abrirBanco(":memory:");
  const tabelas = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((l: any) => l.name);
  expect(tabelas).toContain("raw_estoque");

  // Verifica colunas de raw_estoque
  const cols = db.prepare("PRAGMA table_info(raw_estoque)").all() as any[];
  const nomes = cols.map((c: any) => c.name);
  expect(nomes).toContain("codigo_produto");
  expect(nomes).toContain("codigo_local_estoque");
  expect(nomes).toContain("payload_json");
  expect(nomes).toContain("coletado_em");

  db.close();
});

it("view_produtos tem as 3 colunas de estoque", () => {
  const db = abrirBanco(":memory:");
  const cols = db.prepare("PRAGMA table_info(view_produtos)").all() as any[];
  const nomes = cols.map((c: any) => c.name);
  expect(nomes).toContain("quantidade_em_estoque");
  expect(nomes).toContain("valor_em_estoque_custo");
  expect(nomes).toContain("valor_em_estoque_venda");
  db.close();
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npm --prefix packages/omie-data test -- database.test.ts`
Expected: FAIL — `raw_estoque` não existe, colunas não existem.

- [ ] **Step 3: Implementar `database.ts` com as novas tabelas/colunas**

```typescript
db.exec(`
  CREATE TABLE IF NOT EXISTS raw_estoque (
    codigo_produto INTEGER,
    codigo_local_estoque INTEGER,
    payload_json TEXT NOT NULL,
    coletado_em TEXT NOT NULL,
    PRIMARY KEY (codigo_produto, codigo_local_estoque)
  );
`);

// Migração: adiciona colunas de estoque em view_produtos se não existirem
for (const col of ["quantidade_em_estoque", "valor_em_estoque_custo", "valor_em_estoque_venda"]) {
  try {
    db.exec(`ALTER TABLE view_produtos ADD COLUMN ${col} REAL NOT NULL DEFAULT 0`);
  } catch {
    // coluna já existe — ignora
  }
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npm --prefix packages/omie-data test -- database.test.ts`
Expected: PASS

- [ ] **Step 5: Rodar suíte completa + build + commit**

```bash
npm --prefix packages/omie-data test
npm --prefix packages/omie-data run build
git add packages/omie-data/src/infrastructure/database.ts packages/omie-data/src/infrastructure/database.test.ts
git commit -m "feat(omie-data): schema raw_estoque + colunas de estoque em view_produtos"
```

---

## Commit 2: Módulo de estoque

### Task 4: Tipos de domínio de estoque (`PosicaoEstoque`)

**Files:**
- Create: `packages/omie-data/src/modules/estoque/domain/estoque.ts`

**Interfaces:**
- `PosicaoEstoque`: tipo cru como a Omie devolve em `ListarPosEstoque`

**Nota:** Sem teste — é só tipo, sem comportamento. Mas o arquivo é necessário pras tasks seguintes compilarem.

- [ ] **Step 1: Criar `modules/estoque/domain/estoque.ts`**

```typescript
/** Uma posição de estoque como a Omie devolve em ListarPosEstoque. */
export interface PosicaoEstoqueOmieBruta {
  cCodigo: string;
  cDescricao: string;
  codigo_local_estoque: number;
  fisico: number;
  nCodProd: number;
  nSaldo: number;
  reservado: number;
  nPendente: number;
  nCMC: number;
}
```

- [ ] **Step 2: Build + commit**

```bash
npm --prefix packages/omie-data run build
git add packages/omie-data/src/modules/estoque/domain/estoque.ts
git commit -m "feat(omie-data): tipo PosicaoEstoqueOmieBruta"
```

---

### Task 5: Interface `IEstoqueHttpClient` com método real

**Files:**
- Update: `packages/omie-data/src/domain/estoque-http-client.ts`
- Update: `packages/omie-data/src/infrastructure/fake-http-client.ts`
- Update: `packages/omie-data/src/infrastructure/fake-http-client.test.ts`

**What changes:**
- `IEstoqueHttpClient` ganha `listarPosicoesEstoquePagina(pagina, registrosPorPagina): Promise<ListarPosEstoqueResponseBruto>`
- `FakeHttpClient` implementa `IEstoqueHttpClient` (construtor recebe array de `PosicaoEstoqueOmieBruta`)
- Teste do fake cobre paginação de posições de estoque

- [ ] **Step 1: Atualizar `domain/estoque-http-client.ts`**

```typescript
import { PosicaoEstoqueOmieBruta } from "../modules/estoque/domain/estoque.js";

export interface ListarPosEstoqueResponseBruto {
  pagina: number;
  total_de_paginas: number;
  pos_estoque: PosicaoEstoqueOmieBruta[];
}

export interface IEstoqueHttpClient {
  listarPosicoesEstoquePagina(
    pagina: number,
    registrosPorPagina: number
  ): Promise<ListarPosEstoqueResponseBruto>;
}
```

- [ ] **Step 2: Escrever teste do fake para estoque**

Adicionar ao `fake-http-client.test.ts`:

```typescript
it("pagina posições de estoque", async () => {
  const posicoes: PosicaoEstoqueOmieBruta[] = [
    { cCodigo: "P1", cDescricao: "Prod 1", codigo_local_estoque: 1, fisico: 10, nCodProd: 100, nSaldo: 8, reservado: 2, nPendente: 0, nCMC: 5.5 },
    { cCodigo: "P2", cDescricao: "Prod 2", codigo_local_estoque: 1, fisico: 20, nCodProd: 200, nSaldo: 18, reservado: 2, nPendente: 0, nCMC: 3.0 },
  ];
  const client = new FakeHttpClient([], posicoes);

  const pagina1 = await client.listarPosicoesEstoquePagina(1, 1);

  expect(pagina1.pagina).toBe(1);
  expect(pagina1.total_de_paginas).toBe(2);
  expect(pagina1.pos_estoque).toHaveLength(1);
  expect(pagina1.pos_estoque[0].cCodigo).toBe("P1");
});
```

- [ ] **Step 3: Rodar o teste e confirmar que falha**

Run: `npm --prefix packages/omie-data test -- fake-http-client.test.ts`
Expected: FAIL — `FakeHttpClient` não tem `listarPosicoesEstoquePagina`.

- [ ] **Step 4: Atualizar `FakeHttpClient`**

```typescript
import { IEstoqueHttpClient, ListarPosEstoqueResponseBruto } from "../domain/estoque-http-client.js";
import { PosicaoEstoqueOmieBruta } from "../modules/estoque/domain/estoque.js";

export class FakeHttpClient implements IProdutosHttpClient, IEstoqueHttpClient {
  constructor(
    private readonly produtos: ProdutoOmieBruto[] = [],
    private readonly posicoesEstoque: PosicaoEstoqueOmieBruta[] = []
  ) {}

  // ... listarProdutosPagina (igual antes) ...

  async listarPosicoesEstoquePagina(pagina: number, registrosPorPagina: number): Promise<ListarPosEstoqueResponseBruto> {
    const inicio = (pagina - 1) * registrosPorPagina;
    const fatia = this.posicoesEstoque.slice(inicio, inicio + registrosPorPagina);
    const totalPaginas = Math.max(1, Math.ceil(this.posicoesEstoque.length / registrosPorPagina));
    return { pagina, total_de_paginas, pos_estoque: fatia };
  }
}
```

- [ ] **Step 5: Rodar o teste e confirmar que passa**

Run: `npm --prefix packages/omie-data test -- fake-http-client.test.ts`
Expected: PASS

- [ ] **Step 6: Rodar suíte completa + build + commit**

```bash
npm --prefix packages/omie-data test
npm --prefix packages/omie-data run build
git add ...
git commit -m "feat(omie-data): IEstoqueHttpClient + FakeHttpClient com paginação de posições de estoque"
```

---

### Task 6: Coleta de estoque (`collectEstoque`)

**Files:**
- Create: `packages/omie-data/src/modules/estoque/application/collect-estoque.ts`
- Create: `packages/omie-data/src/modules/estoque/application/collect-estoque.test.ts`

**Interfaces:**
- `async function collectEstoque(db: Database.Database, client: IEstoqueHttpClient): Promise<number>` — retorna total de posições coletadas; grava/atualiza `raw_estoque`.

**Comportamento:**
- Varre páginas de `ListarPosEstoque`, 100 registros por página, teto de 1000 páginas, 200ms de espera entre páginas
- Upsert por `(codigo_produto, codigo_local_estoque)`

- [ ] **Step 1: Escrever o teste que falha**

```typescript
import { describe, expect, it } from "vitest";
import { abrirBanco } from "../../../infrastructure/database.js";
import { FakeHttpClient } from "../../../infrastructure/fake-http-client.js";
import { PosicaoEstoqueOmieBruta } from "../domain/estoque.js";
import { collectEstoque } from "./collect-estoque.js";

describe("collectEstoque", () => {
  it("grava cada posição em raw_estoque com payload bruto", async () => {
    const db = abrirBanco(":memory:");
    const posicoes: PosicaoEstoqueOmieBruta[] = [
      { cCodigo: "P1", cDescricao: "Prod 1", codigo_local_estoque: 1, fisico: 10, nCodProd: 100, nSaldo: 8, reservado: 2, nPendente: 0, nCMC: 5.5 },
    ];
    const client = new FakeHttpClient([], posicoes);

    const total = await collectEstoque(db, client);

    expect(total).toBe(1);

    const linha = db.prepare(
      "SELECT codigo_produto, codigo_local_estoque, payload_json, coletado_em FROM raw_estoque WHERE codigo_produto = 100 AND codigo_local_estoque = 1"
    ).get() as any;

    expect(linha.codigo_produto).toBe(100);
    expect(JSON.parse(linha.payload_json).fisico).toBe(10);
    expect(linha.coletado_em).toBeTruthy();

    db.close();
  });

  it("faz upsert: mesmo produto+local rodado duas vezes não duplica", async () => {
    const db = abrirBanco(":memory:");
    const posicoes: PosicaoEstoqueOmieBruta[] = [
      { cCodigo: "P1", cDescricao: "Prod 1", codigo_local_estoque: 1, fisico: 10, nCodProd: 100, nSaldo: 8, reservado: 2, nPendente: 0, nCMC: 5.5 },
    ];
    const client = new FakeHttpClient([], posicoes);

    await collectEstoque(db, client);
    await collectEstoque(db, client);

    const linhas = db.prepare("SELECT COUNT(*) as total FROM raw_estoque").get() as { total: number };
    expect(linhas.total).toBe(1);

    db.close();
  });

  it("aguarda entre páginas quando há mais de uma", async () => {
    const db = abrirBanco(":memory:");
    const posicoes = Array.from({ length: 150 }, (_, i) => ({
      cCodigo: `P${i + 1}`, cDescricao: `Prod ${i + 1}`, codigo_local_estoque: 1,
      fisico: 10, nCodProd: i + 1, nSaldo: 8, reservado: 2, nPendente: 0, nCMC: 5,
    }));
    const client = new FakeHttpClient([], posicoes);

    const total = await collectEstoque(db, client, 0); // sem espera no teste

    expect(total).toBe(150);
    db.close();
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npm --prefix packages/omie-data test -- collect-estoque.test.ts`
Expected: FAIL — "Cannot find module './collect-estoque.js'"

- [ ] **Step 3: Implementar `collect-estoque.ts`**

```typescript
import type Database from "better-sqlite3";
import { IEstoqueHttpClient } from "../../../domain/estoque-http-client.js";

const REGISTROS_POR_PAGINA = 100;
const TETO_PAGINAS = 1000;
const ESPERA_ENTRE_PAGINAS_MS = 200;

function aguardar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function collectEstoque(
  db: Database.Database,
  client: IEstoqueHttpClient,
  esperaEntrePaginasMs: number = ESPERA_ENTRE_PAGINAS_MS
): Promise<number> {
  const upsert = db.prepare(`
    INSERT INTO raw_estoque (codigo_produto, codigo_local_estoque, payload_json, coletado_em)
    VALUES (@codigo_produto, @codigo_local_estoque, @payload_json, @coletado_em)
    ON CONFLICT(codigo_produto, codigo_local_estoque) DO UPDATE SET
      payload_json = excluded.payload_json,
      coletado_em = excluded.coletado_em
  `);

  let pagina = 1;
  let totalPaginas = 1;
  let totalColetado = 0;
  const agora = new Date().toISOString();

  do {
    if (pagina > 1) {
      await aguardar(esperaEntrePaginasMs);
    }

    const resposta = await client.listarPosicoesEstoquePagina(pagina, REGISTROS_POR_PAGINA);
    totalPaginas = Math.min(resposta.total_de_paginas, TETO_PAGINAS);

    for (const posicao of resposta.pos_estoque) {
      upsert.run({
        codigo_produto: posicao.nCodProd,
        codigo_local_estoque: posicao.codigo_local_estoque,
        payload_json: JSON.stringify(posicao),
        coletado_em: agora,
      });
      totalColetado++;
    }

    pagina++;
  } while (pagina <= totalPaginas);

  return totalColetado;
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npm --prefix packages/omie-data test -- collect-estoque.test.ts`
Expected: PASS

- [ ] **Step 5: Rodar suíte completa + build + commit**

```bash
npm --prefix packages/omie-data test
npm --prefix packages/omie-data run build
git add ...
git commit -m "feat(omie-data): collectEstoque grava posições em raw_estoque"
```

---

### Task 7: Enriquecer `ProdutoView` com campos de estoque

**Files:**
- Update: `packages/omie-data/src/modules/produtos/domain/produto.ts`

**What changes:**
- `ProdutoView` ganha 3 campos: `quantidadeEmEstoque: number`, `valorEmEstoqueCusto: number`, `valorEmEstoqueVenda: number`

- [ ] **Step 1: Atualizar `ProdutoView`**

Adicionar os 3 campos à interface. Build vai quebrar em `translateProdutos` e `consultarProdutos` porque eles constroem `ProdutoView` sem esses campos — isso é esperado, as próximas tasks corrigem.

- [ ] **Step 2: Commit (com build quebrando — ok, as próximas tasks corrigem)**

```bash
git add packages/omie-data/src/modules/produtos/domain/produto.ts
git commit -m "feat(omie-data): ProdutoView com quantidadeEmEstoque, valorEmEstoqueCusto, valorEmEstoqueVenda"
```

---

### Task 8: Atualizar `translateProdutos` com join de `raw_estoque`

**Files:**
- Update: `packages/omie-data/src/modules/produtos/application/translate-produtos.ts`
- Update: `packages/omie-data/src/modules/produtos/application/translate-produtos.test.ts`

**What changes:**
- `translateProdutos` passa a ler `raw_estoque`, agrupar por `codigo_produto` (somar `fisico`, somar `fisico * nCMC`), e incluir as 3 colunas no upsert de `view_produtos`
- Se não há posição de estoque pra um produto, colunas ficam `0`

- [ ] **Step 1: Atualizar os testes existentes + adicionar teste de join**

Testes existentes precisam ser atualizados porque agora `view_produtos` tem mais colunas no upsert. Adicionar teste que insere `raw_produtos` + `raw_estoque` e verifica as colunas de estoque na view.

```typescript
it("faz join com raw_estoque e calcula quantidade e valor em estoque", () => {
  const db = abrirBanco(":memory:");

  // Insere produto
  db.prepare(
    "INSERT INTO raw_produtos (codigo_produto, payload_json, coletado_em) VALUES (?, ?, ?)"
  ).run(
    1,
    JSON.stringify({
      codigo_produto: 1, codigo: "A", descricao: "Produto A", unidade: "UN",
      valor_unitario: 10, inativo: "N", codigo_familia: 1, descricao_familia: "Cat X",
    }),
    new Date().toISOString()
  );

  // Insere duas posições de estoque pro mesmo produto (locais diferentes)
  const agora = new Date().toISOString();
  db.prepare(
    "INSERT INTO raw_estoque (codigo_produto, codigo_local_estoque, payload_json, coletado_em) VALUES (?, ?, ?, ?)"
  ).run(1, 1, JSON.stringify({
    cCodigo: "P1", cDescricao: "Prod 1", codigo_local_estoque: 1,
    fisico: 10, nCodProd: 1, nSaldo: 8, reservado: 2, nPendente: 0, nCMC: 5.5,
  }), agora);
  db.prepare(
    "INSERT INTO raw_estoque (codigo_produto, codigo_local_estoque, payload_json, coletado_em) VALUES (?, ?, ?, ?)"
  ).run(1, 2, JSON.stringify({
    cCodigo: "P1", cDescricao: "Prod 1", codigo_local_estoque: 2,
    fisico: 20, nCodProd: 1, nSaldo: 18, reservado: 2, nPendente: 0, nCMC: 3.0,
  }), agora);

  translateProdutos(db);

  const view = db.prepare("SELECT * FROM view_produtos WHERE codigo_produto = 1").get() as any;
  expect(view.quantidade_em_estoque).toBe(30);        // 10 + 20
  expect(view.valor_em_estoque_custo).toBe(115);       // 10*5.5 + 20*3.0 = 55 + 60
  expect(view.valor_em_estoque_venda).toBe(300);       // 30 * 10

  db.close();
});

it("produto sem estoque fica com zero nas colunas de estoque", () => {
  const db = abrirBanco(":memory:");

  db.prepare(
    "INSERT INTO raw_produtos (codigo_produto, payload_json, coletado_em) VALUES (?, ?, ?)"
  ).run(
    1,
    JSON.stringify({
      codigo_produto: 1, codigo: "A", descricao: "Produto A", unidade: "UN",
      valor_unitario: 10, inativo: "N", codigo_familia: 1,
    }),
    new Date().toISOString()
  );

  translateProdutos(db);

  const view = db.prepare("SELECT * FROM view_produtos WHERE codigo_produto = 1").get() as any;
  expect(view.quantidade_em_estoque).toBe(0);
  expect(view.valor_em_estoque_custo).toBe(0);
  expect(view.valor_em_estoque_venda).toBe(0);

  db.close();
});
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npm --prefix packages/omie-data test -- translate-produtos.test.ts`
Expected: FAIL — erros de compilação (campos novos faltando no upsert) ou asserts quebrando (colunas não preenchidas).

- [ ] **Step 3: Implementar `translateProdutos` com join de estoque**

Adicionar ao início da função:

```typescript
// Lê e agrupa posições de estoque por produto
const posicoesEstoque = db
  .prepare("SELECT payload_json FROM raw_estoque")
  .all() as { payload_json: string }[];

const estoquePorProduto = new Map<number, { quantidade: number; custoTotal: number }>();
for (const linha of posicoesEstoque) {
  const posicao = JSON.parse(linha.payload_json);
  const atual = estoquePorProduto.get(posicao.nCodProd) ?? { quantidade: 0, custoTotal: 0 };
  atual.quantidade += posicao.fisico;
  atual.custoTotal += posicao.fisico * posicao.nCMC;
  estoquePorProduto.set(posicao.nCodProd, atual);
}
```

E no upsert, adicionar as 3 colunas:

```typescript
const estoque = estoquePorProduto.get(produto.codigo_produto) ?? { quantidade: 0, custoTotal: 0 };
const quantidadeEmEstoque = round2(estoque.quantidade);
const valorUnitario = produto.valor_unitario ?? 0;

upsert.run({
  // ... campos existentes ...
  quantidade_em_estoque: quantidadeEmEstoque,
  valor_em_estoque_custo: round2(estoque.custoTotal),
  valor_em_estoque_venda: round2(quantidadeEmEstoque * valorUnitario),
});
```

Adicionar helper `round2`:

```typescript
function round2(valor: number): number {
  return Math.round(valor * 100) / 100;
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npm --prefix packages/omie-data test -- translate-produtos.test.ts`
Expected: PASS (todos os 5 testes)

- [ ] **Step 5: Rodar suíte completa + build + commit**

```bash
npm --prefix packages/omie-data test
npm --prefix packages/omie-data run build
git add ...
git commit -m "feat(omie-data): translateProdutos faz join com raw_estoque e calcula quantidade/valor em estoque"
```

---

### Task 9: Atualizar `consultarProdutos` para retornar campos de estoque

**Files:**
- Update: `packages/omie-data/src/modules/produtos/application/consultar-produtos.ts`
- Update: `packages/omie-data/src/modules/produtos/application/consultar-produtos.test.ts`

**What changes:**
- A query SELECT ganha as 3 colunas novas
- O mapeamento `ProdutoView` inclui os 3 campos
- Testes verificam que os campos vêm preenchidos

- [ ] **Step 1: Atualizar os testes**

Adicionar asserts nos testes existentes verificando que `quantidadeEmEstoque`, `valorEmEstoqueCusto`, `valorEmEstoqueVenda` vêm no resultado.

- [ ] **Step 2: Rodar e confirmar falha (compilação)**

- [ ] **Step 3: Atualizar `consultarProdutos`**

Adicionar as 3 colunas no SELECT e no map.

- [ ] **Step 4: Rodar testes + suíte + build + commit**

---

### Task 10: Atualizar `rodarProdutos` para coletar estoque

**Files:**
- Update: `packages/omie-data/src/modules/produtos/application/rodar-produtos.ts`
- Update: `packages/omie-data/src/modules/produtos/application/rodar-produtos.test.ts`

**What changes:**
- `rodarProdutos` passa a receber `IEstoqueHttpClient` (ou um client que implementa ambas as interfaces)
- Quando `atualizar=true`, chama `collectEstoque` antes de `translateProdutos`
- `collectProdutos` e `collectEstoque` podem rodar em paralelo (Promise.all)

**Precisa decidir:** `rodarProdutos` recebe um client só (que implementa ambas) ou dois parâmetros separados? O design disse 4-B (interfaces separadas), mas na prática `OmieHttpClientReal` e `FakeHttpClient` implementam ambas. Passar um objeto só que implementa ambas é mais limpo.

- [ ] **Step 1: Atualizar os testes de `rodar-produtos.test.ts`**

Testes existentes injetam `FakeHttpClient` só com produtos. Precisam ser atualizados pra incluir posições de estoque (array vazio é suficiente pros testes que não testam estoque). Adicionar teste que verifica que `atualizar=true` coleta estoque e aparece no resultado.

- [ ] **Step 2: Rodar e confirmar falha**

- [ ] **Step 3: Implementar**

```typescript
export async function rodarProdutos(
  db: Database.Database,
  produtosClient: IProdutosHttpClient,
  estoqueClient: IEstoqueHttpClient,
  atualizar: boolean,
  filtros?: FiltrosProdutos
): Promise<ResultadoConsultaProdutos> {
  if (atualizar) {
    await Promise.all([
      collectProdutos(db, produtosClient),
      collectEstoque(db, estoqueClient),
    ]);
    translateProdutos(db);
  }

  return consultarProdutos(db, filtros);
}
```

- [ ] **Step 4: Rodar testes + suíte + build + commit**

---

### Task 11: Atualizar `cli.ts` — `formatarResultadoProdutos` e chamada `rodarProdutos`

**Files:**
- Update: `packages/omie-data/src/cli.ts`
- Update: `packages/omie-data/src/cli.test.ts`

**What changes:**
- `formatarResultadoProdutos`: tabela ganha coluna "Estoque" entre "Valor" e "Ativo"
- Chamada a `rodarProdutos` passa o cliente de estoque
- `OmieHttpClientReal` passa a implementar `IEstoqueHttpClient` (método `listarPosicoesEstoquePagina`)

- [ ] **Step 1: Atualizar `OmieHttpClientReal` (`http-client-real.ts`)**

Adicionar `listarPosicoesEstoquePagina` que bate em `POST https://app.omie.com.br/api/v1/estoque/consulta/` com call `ListarPosEstoque`. Mesmo padrão de retry e tratamento de erro do método de produtos.

- [ ] **Step 2: Atualizar testes de `cli.test.ts`**

Testes de `formatarResultadoProdutos` precisam incluir os campos de estoque no `ProdutoView`. Verificar que a coluna "Estoque" aparece na saída formatada.

- [ ] **Step 3: Rodar e confirmar falha**

- [ ] **Step 4: Implementar**

- [ ] **Step 5: Rodar suíte completa + build + commit**

---

### Task 12: Atualizar `rodar-menu-principal.ts` e `rodar-ajuda-interativo.ts`

**Files:**
- Update: `packages/omie-data/src/application/rodar-menu-principal.ts`
- Update: `packages/omie-data/src/application/rodar-menu-principal.test.ts`
- Update: `packages/omie-data/src/application/rodar-ajuda-interativo.ts`
- Update: `packages/omie-data/src/application/rodar-ajuda-interativo.test.ts`

**What changes:**
- `rodarMenuPrincipal` e `rodarAjudaInterativaEmLoop` passam o client de estoque pra `rodarProdutos`
- Ajustar interfaces de callback se necessário

- [ ] **Step 1: Atualizar código e testes**
- [ ] **Step 2: Rodar suíte completa + build + commit**

---

## Resumo de tasks

| # | Task | Commit |
|---|------|--------|
| 1 | Split interfaces HTTP + mover domínio | 1 |
| 2 | Mover application de produtos | 1 |
| 3 | `database.ts` — `raw_estoque` + colunas em `view_produtos` | 1 |
| 4 | Tipo `PosicaoEstoqueOmieBruta` | 2 |
| 5 | `IEstoqueHttpClient` + atualizar `FakeHttpClient` | 2 |
| 6 | `collectEstoque` | 2 |
| 7 | Atualizar `ProdutoView` com 3 campos | 2 |
| 8 | Atualizar `translateProdutos` com join | 2 |
| 9 | Atualizar `consultarProdutos` | 2 |
| 10 | Atualizar `rodarProdutos` | 2 |
| 11 | Atualizar `cli.ts` + `http-client-real.ts` | 2 |
| 12 | Atualizar menus interativos | 2 |

## Fora de escopo

- CLI independente de estoque (`omie-data estoque ...`)
- Menu de estoque no interativo
- Ajustes de estoque (incluir/excluir)
- `consultarEstoque()` separado
- Alterações no servidor MCP
