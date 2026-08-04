# omie-data — Piloto Produtos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o pacote `packages/omie-data`, com o pipeline de duas etapas (coleta bruta + tradução) e consulta com verificação de frescor, pro módulo Produtos, como piloto do design descrito em `docs/superpowers/specs/2026-08-03-omie-data-skill-design.md`.

**Architecture:** Pacote TypeScript isolado (`packages/omie-data/`, zero import de `src/` do omie-mcp), com SQLite (`better-sqlite3`) como storage, um `.db` por credencial. Duas tabelas por módulo de dado: `raw_produtos` (payload bruto da Omie) e `view_produtos` (traduzido, pré-calculado). Cliente HTTP próprio pra API Omie, com uma implementação real e uma fake pra testes.

**Tech Stack:** TypeScript, Vitest, better-sqlite3, Node `fetch` nativo (sem lib HTTP extra).

## Global Constraints

- Pacote não importa nada de `src/` do omie-mcp (design doc, seção "Requisito de portabilidade").
- Todo dado de negócio devolvido ao usuário é sempre a versão traduzida (`view_produtos`), nunca o JSON cru, exceto se explicitamente pedido (spec, "Fluxo do usuário final").
- `translate` nunca chama a rede — só lê `raw_produtos` e escreve `view_produtos`.
- `collect` nunca traduz — só grava o payload bruto tal como veio da Omie.
- Sem escrita/alteração de dado na Omie neste piloto (spec, "Fora de escopo").

---

### Task 1: Scaffolding do pacote `packages/omie-data`

**Files:**
- Create: `packages/omie-data/package.json`
- Create: `packages/omie-data/tsconfig.json`
- Create: `packages/omie-data/vitest.config.ts`
- Create: `packages/omie-data/src/index.ts`

**Interfaces:**
- Produces: pacote instalável/testável via `npm --prefix packages/omie-data install` e `npm --prefix packages/omie-data test`.

- [ ] **Step 1: Criar `package.json`**

```json
{
  "name": "omie-data",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run"
  },
  "dependencies": {
    "better-sqlite3": "^11.3.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.11",
    "@types/node": "^20.14.2",
    "typescript": "^5.5.3",
    "vitest": "^4.1.10"
  }
}
```

- [ ] **Step 2: Criar `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "outDir": "dist",
    "rootDir": "src",
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Criar `vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
  },
});
```

- [ ] **Step 4: Criar `src/index.ts` vazio (placeholder de entrada, será populado nas próximas tasks)**

```typescript
export {};
```

- [ ] **Step 5: Instalar dependências**

Run: `npm --prefix packages/omie-data install`
Expected: instala sem erro, cria `packages/omie-data/node_modules` e `package-lock.json`.

- [ ] **Step 6: Commit**

```bash
git add packages/omie-data/package.json packages/omie-data/tsconfig.json packages/omie-data/vitest.config.ts packages/omie-data/src/index.ts packages/omie-data/package-lock.json
git commit -m "chore(omie-data): scaffold do pacote isolado"
```

---

### Task 2: Tipos de domínio (Produto bruto e Produto view)

**Files:**
- Create: `packages/omie-data/src/domain/produto.ts`

**Interfaces:**
- Produces:
  - `interface ProdutoOmieBruto` — payload como a API Omie devolve.
  - `interface ProdutoView` — payload traduzido/legível.

- [ ] **Step 1: Criar `src/domain/produto.ts`**

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

- [ ] **Step 2: Commit**

```bash
git add packages/omie-data/src/domain/produto.ts
git commit -m "feat(omie-data): tipos de domínio ProdutoOmieBruto e ProdutoView"
```

---

### Task 3: Banco SQLite (schema `raw_produtos` + `view_produtos`)

**Files:**
- Create: `packages/omie-data/src/infrastructure/database.ts`
- Test: `packages/omie-data/src/infrastructure/database.test.ts`

**Interfaces:**
- Consumes: nenhum (task independente).
- Produces:
  - `function abrirBanco(caminho: string): Database.Database` — abre (ou cria) o banco e garante as tabelas.
  - Tabela `raw_produtos(codigo_produto INTEGER PRIMARY KEY, payload_json TEXT NOT NULL, coletado_em TEXT NOT NULL)`.
  - Tabela `view_produtos(codigo_produto INTEGER PRIMARY KEY, codigo TEXT NOT NULL, nome TEXT NOT NULL, categoria TEXT NOT NULL, unidade TEXT NOT NULL, valor_formatado TEXT NOT NULL, ativo TEXT NOT NULL, gerado_em TEXT NOT NULL)`.

- [ ] **Step 1: Escrever o teste que falha**

```typescript
// packages/omie-data/src/infrastructure/database.test.ts
import { describe, expect, it } from "vitest";
import { abrirBanco } from "./database.js";

describe("abrirBanco", () => {
  it("cria as tabelas raw_produtos e view_produtos", () => {
    const db = abrirBanco(":memory:");

    const tabelas = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all()
      .map((linha: any) => linha.name);

    expect(tabelas).toContain("raw_produtos");
    expect(tabelas).toContain("view_produtos");

    db.close();
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npm --prefix packages/omie-data test -- database.test.ts`
Expected: FAIL com "Cannot find module './database.js'" (arquivo ainda não existe).

- [ ] **Step 3: Implementar `database.ts`**

```typescript
// packages/omie-data/src/infrastructure/database.ts
import Database from "better-sqlite3";

export function abrirBanco(caminho: string): Database.Database {
  const db = new Database(caminho);

  db.exec(`
    CREATE TABLE IF NOT EXISTS raw_produtos (
      codigo_produto INTEGER PRIMARY KEY,
      payload_json TEXT NOT NULL,
      coletado_em TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS view_produtos (
      codigo_produto INTEGER PRIMARY KEY,
      codigo TEXT NOT NULL,
      nome TEXT NOT NULL,
      categoria TEXT NOT NULL,
      unidade TEXT NOT NULL,
      valor_formatado TEXT NOT NULL,
      ativo TEXT NOT NULL,
      gerado_em TEXT NOT NULL
    );
  `);

  return db;
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npm --prefix packages/omie-data test -- database.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/omie-data/src/infrastructure/database.ts packages/omie-data/src/infrastructure/database.test.ts
git commit -m "feat(omie-data): schema SQLite raw_produtos + view_produtos"
```

---

### Task 4: Cliente HTTP da Omie (interface + fake)

**Files:**
- Create: `packages/omie-data/src/domain/omie-http-client.ts`
- Create: `packages/omie-data/src/infrastructure/fake-omie-http-client.ts`
- Test: `packages/omie-data/src/infrastructure/fake-omie-http-client.test.ts`

**Interfaces:**
- Consumes: `ProdutoOmieBruto` (Task 2).
- Produces:
  - `interface IOmieHttpClient { listarProdutosPagina(pagina: number, registrosPorPagina: number): Promise<ListarProdutosResponseBruto> }`
  - `interface ListarProdutosResponseBruto { pagina: number; total_de_paginas: number; produto_servico_cadastro: ProdutoOmieBruto[] }`
  - `class FakeOmieHttpClient implements IOmieHttpClient` — usado pelos testes de Collect (Task 5), sem rede real.

- [ ] **Step 1: Criar a interface `src/domain/omie-http-client.ts`**

```typescript
import { ProdutoOmieBruto } from "./produto.js";

export interface ListarProdutosResponseBruto {
  pagina: number;
  total_de_paginas: number;
  produto_servico_cadastro: ProdutoOmieBruto[];
}

export interface IOmieHttpClient {
  listarProdutosPagina(
    pagina: number,
    registrosPorPagina: number
  ): Promise<ListarProdutosResponseBruto>;
}
```

- [ ] **Step 2: Escrever o teste do fake que falha**

```typescript
// packages/omie-data/src/infrastructure/fake-omie-http-client.test.ts
import { describe, expect, it } from "vitest";
import { FakeOmieHttpClient } from "./fake-omie-http-client.js";

describe("FakeOmieHttpClient", () => {
  it("devolve os produtos configurados, paginados", async () => {
    const client = new FakeOmieHttpClient([
      { codigo_produto: 1, codigo: "A", descricao: "Produto A", unidade: "UN", valor_unitario: 10, inativo: "N", codigo_familia: 1, descricao_familia: "Fam 1" },
      { codigo_produto: 2, codigo: "B", descricao: "Produto B", unidade: "UN", valor_unitario: 20, inativo: "N", codigo_familia: 1, descricao_familia: "Fam 1" },
    ]);

    const pagina1 = await client.listarProdutosPagina(1, 1);

    expect(pagina1.pagina).toBe(1);
    expect(pagina1.total_de_paginas).toBe(2);
    expect(pagina1.produto_servico_cadastro).toHaveLength(1);
    expect(pagina1.produto_servico_cadastro[0].codigo).toBe("A");
  });
});
```

- [ ] **Step 3: Rodar o teste e confirmar que falha**

Run: `npm --prefix packages/omie-data test -- fake-omie-http-client.test.ts`
Expected: FAIL com "Cannot find module './fake-omie-http-client.js'"

- [ ] **Step 4: Implementar o fake**

```typescript
// packages/omie-data/src/infrastructure/fake-omie-http-client.ts
import { IOmieHttpClient, ListarProdutosResponseBruto } from "../domain/omie-http-client.js";
import { ProdutoOmieBruto } from "../domain/produto.js";

export class FakeOmieHttpClient implements IOmieHttpClient {
  constructor(private readonly produtos: ProdutoOmieBruto[]) {}

  async listarProdutosPagina(
    pagina: number,
    registrosPorPagina: number
  ): Promise<ListarProdutosResponseBruto> {
    const inicio = (pagina - 1) * registrosPorPagina;
    const fatia = this.produtos.slice(inicio, inicio + registrosPorPagina);
    const totalPaginas = Math.max(1, Math.ceil(this.produtos.length / registrosPorPagina));

    return {
      pagina,
      total_de_paginas: totalPaginas,
      produto_servico_cadastro: fatia,
    };
  }
}
```

- [ ] **Step 5: Rodar o teste e confirmar que passa**

Run: `npm --prefix packages/omie-data test -- fake-omie-http-client.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/omie-data/src/domain/omie-http-client.ts packages/omie-data/src/infrastructure/fake-omie-http-client.ts packages/omie-data/src/infrastructure/fake-omie-http-client.test.ts
git commit -m "feat(omie-data): interface IOmieHttpClient + FakeOmieHttpClient pra testes"
```

---

### Task 5: Coleta (`collectProdutos`)

**Files:**
- Create: `packages/omie-data/src/application/collect-produtos.ts`
- Test: `packages/omie-data/src/application/collect-produtos.test.ts`

**Interfaces:**
- Consumes: `abrirBanco` (Task 3), `IOmieHttpClient`/`FakeOmieHttpClient` (Task 4), `ProdutoOmieBruto` (Task 2).
- Produces: `async function collectProdutos(db: Database.Database, client: IOmieHttpClient): Promise<number>` — retorna quantidade de produtos coletados; grava/atualiza `raw_produtos`.

- [ ] **Step 1: Escrever o teste que falha**

```typescript
// packages/omie-data/src/application/collect-produtos.test.ts
import { describe, expect, it } from "vitest";
import { abrirBanco } from "../infrastructure/database.js";
import { FakeOmieHttpClient } from "../infrastructure/fake-omie-http-client.js";
import { collectProdutos } from "./collect-produtos.js";

describe("collectProdutos", () => {
  it("grava cada produto em raw_produtos com payload bruto e timestamp", async () => {
    const db = abrirBanco(":memory:");
    const client = new FakeOmieHttpClient([
      { codigo_produto: 1, codigo: "A", descricao: "Produto A", unidade: "UN", valor_unitario: 10, inativo: "N", codigo_familia: 1, descricao_familia: "Fam 1" },
    ]);

    const total = await collectProdutos(db, client);

    expect(total).toBe(1);

    const linha = db
      .prepare("SELECT codigo_produto, payload_json, coletado_em FROM raw_produtos WHERE codigo_produto = 1")
      .get() as { codigo_produto: number; payload_json: string; coletado_em: string };

    expect(linha.codigo_produto).toBe(1);
    expect(JSON.parse(linha.payload_json).codigo).toBe("A");
    expect(linha.coletado_em).toBeTruthy();

    db.close();
  });

  it("faz upsert: rodar duas vezes não duplica linha", async () => {
    const db = abrirBanco(":memory:");
    const client = new FakeOmieHttpClient([
      { codigo_produto: 1, codigo: "A", descricao: "Produto A", unidade: "UN", valor_unitario: 10, inativo: "N", codigo_familia: 1 },
    ]);

    await collectProdutos(db, client);
    await collectProdutos(db, client);

    const linhas = db.prepare("SELECT COUNT(*) as total FROM raw_produtos").get() as { total: number };
    expect(linhas.total).toBe(1);

    db.close();
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npm --prefix packages/omie-data test -- collect-produtos.test.ts`
Expected: FAIL com "Cannot find module './collect-produtos.js'"

- [ ] **Step 3: Implementar `collect-produtos.ts`**

```typescript
// packages/omie-data/src/application/collect-produtos.ts
import type Database from "better-sqlite3";
import { IOmieHttpClient } from "../domain/omie-http-client.js";

const REGISTROS_POR_PAGINA = 100;

export async function collectProdutos(
  db: Database.Database,
  client: IOmieHttpClient
): Promise<number> {
  const upsert = db.prepare(`
    INSERT INTO raw_produtos (codigo_produto, payload_json, coletado_em)
    VALUES (@codigo_produto, @payload_json, @coletado_em)
    ON CONFLICT(codigo_produto) DO UPDATE SET
      payload_json = excluded.payload_json,
      coletado_em = excluded.coletado_em
  `);

  let pagina = 1;
  let totalPaginas = 1;
  let totalColetado = 0;
  const agora = new Date().toISOString();

  do {
    const resposta = await client.listarProdutosPagina(pagina, REGISTROS_POR_PAGINA);
    totalPaginas = resposta.total_de_paginas;

    for (const produto of resposta.produto_servico_cadastro) {
      upsert.run({
        codigo_produto: produto.codigo_produto,
        payload_json: JSON.stringify(produto),
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

Run: `npm --prefix packages/omie-data test -- collect-produtos.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/omie-data/src/application/collect-produtos.ts packages/omie-data/src/application/collect-produtos.test.ts
git commit -m "feat(omie-data): collectProdutos grava payload bruto em raw_produtos"
```

---

### Task 6: Tradução (`translateProdutos`)

**Files:**
- Create: `packages/omie-data/src/application/translate-produtos.ts`
- Test: `packages/omie-data/src/application/translate-produtos.test.ts`

**Interfaces:**
- Consumes: `abrirBanco` (Task 3), `ProdutoOmieBruto`/`ProdutoView` (Task 2).
- Produces: `function translateProdutos(db: Database.Database): number` — retorna quantidade traduzida; lê `raw_produtos`, grava/atualiza `view_produtos`. Regras: `nome = descricao`; `categoria = descricao_familia ?? "Sem categoria"`; `valorFormatado` em `R$ 1.234,56`; `ativo = inativo === "N" ? "Sim" : "Não"` (conforme `referencia/formatacao-saida.md`).

- [ ] **Step 1: Escrever o teste que falha**

```typescript
// packages/omie-data/src/application/translate-produtos.test.ts
import { describe, expect, it } from "vitest";
import { abrirBanco } from "../infrastructure/database.js";
import { translateProdutos } from "./translate-produtos.js";

describe("translateProdutos", () => {
  it("traduz raw_produtos pra view_produtos com campos legíveis", () => {
    const db = abrirBanco(":memory:");

    db.prepare(
      "INSERT INTO raw_produtos (codigo_produto, payload_json, coletado_em) VALUES (?, ?, ?)"
    ).run(
      1,
      JSON.stringify({
        codigo_produto: 1,
        codigo: "A",
        descricao: "Produto A",
        unidade: "UN",
        valor_unitario: 1234.5,
        inativo: "N",
        codigo_familia: 1,
        descricao_familia: "Categoria X",
      }),
      new Date().toISOString()
    );

    const total = translateProdutos(db);

    expect(total).toBe(1);

    const view = db
      .prepare("SELECT * FROM view_produtos WHERE codigo_produto = 1")
      .get() as any;

    expect(view.codigo).toBe("A");
    expect(view.nome).toBe("Produto A");
    expect(view.categoria).toBe("Categoria X");
    expect(view.valor_formatado).toBe("R$ 1.234,50");
    expect(view.ativo).toBe("Sim");
    expect(view.gerado_em).toBeTruthy();

    db.close();
  });

  it("usa 'Sem categoria' quando descricao_familia não vem", () => {
    const db = abrirBanco(":memory:");

    db.prepare(
      "INSERT INTO raw_produtos (codigo_produto, payload_json, coletado_em) VALUES (?, ?, ?)"
    ).run(
      2,
      JSON.stringify({
        codigo_produto: 2,
        codigo: "B",
        descricao: "Produto B",
        unidade: "UN",
        valor_unitario: 5,
        inativo: "S",
        codigo_familia: 0,
      }),
      new Date().toISOString()
    );

    translateProdutos(db);

    const view = db.prepare("SELECT * FROM view_produtos WHERE codigo_produto = 2").get() as any;
    expect(view.categoria).toBe("Sem categoria");
    expect(view.ativo).toBe("Não");

    db.close();
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npm --prefix packages/omie-data test -- translate-produtos.test.ts`
Expected: FAIL com "Cannot find module './translate-produtos.js'"

- [ ] **Step 3: Implementar `translate-produtos.ts`**

```typescript
// packages/omie-data/src/application/translate-produtos.ts
import type Database from "better-sqlite3";
import { ProdutoOmieBruto } from "../domain/produto.js";

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).replace(/ /g, " ").replace("R$ ", "R$ ").trim();
}

export function translateProdutos(db: Database.Database): number {
  const brutos = db
    .prepare("SELECT payload_json FROM raw_produtos")
    .all() as { payload_json: string }[];

  const upsert = db.prepare(`
    INSERT INTO view_produtos (codigo_produto, codigo, nome, categoria, unidade, valor_formatado, ativo, gerado_em)
    VALUES (@codigo_produto, @codigo, @nome, @categoria, @unidade, @valor_formatado, @ativo, @gerado_em)
    ON CONFLICT(codigo_produto) DO UPDATE SET
      codigo = excluded.codigo,
      nome = excluded.nome,
      categoria = excluded.categoria,
      unidade = excluded.unidade,
      valor_formatado = excluded.valor_formatado,
      ativo = excluded.ativo,
      gerado_em = excluded.gerado_em
  `);

  const agora = new Date().toISOString();
  let total = 0;

  for (const linha of brutos) {
    const produto: ProdutoOmieBruto = JSON.parse(linha.payload_json);

    upsert.run({
      codigo_produto: produto.codigo_produto,
      codigo: produto.codigo,
      nome: produto.descricao,
      categoria: produto.descricao_familia ?? "Sem categoria",
      unidade: produto.unidade,
      valor_formatado: formatarMoeda(produto.valor_unitario),
      ativo: produto.inativo === "N" ? "Sim" : "Não",
      gerado_em: agora,
    });
    total++;
  }

  return total;
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npm --prefix packages/omie-data test -- translate-produtos.test.ts`
Expected: PASS (se `toLocaleString` no ambiente Node não gerar exatamente `R$ 1.234,50`, ajustar `formatarMoeda` pra formatação manual: `` `R$ ${valor.toFixed(2).replace(".", ",")}` `` com separador de milhar manual — validar no ambiente real antes de seguir).

- [ ] **Step 5: Commit**

```bash
git add packages/omie-data/src/application/translate-produtos.ts packages/omie-data/src/application/translate-produtos.test.ts
git commit -m "feat(omie-data): translateProdutos gera view_produtos legível"
```

---

### Task 7: Consulta com verificação de frescor (`consultarProdutos`)

**Files:**
- Create: `packages/omie-data/src/application/consultar-produtos.ts`
- Test: `packages/omie-data/src/application/consultar-produtos.test.ts`

**Interfaces:**
- Consumes: `abrirBanco` (Task 3), `ProdutoView` (Task 2).
- Produces:
  - `interface ResultadoConsultaProdutos { status: "sem_dado" | "dado_disponivel"; produtos: ProdutoView[]; geradoEm: string | null; idadeMs: number | null }`
  - `function consultarProdutos(db: Database.Database): ResultadoConsultaProdutos` — nunca decide sozinho se busca de novo; só informa o estado pra quem chamar (a skill) decidir se pergunta ao usuário, conforme o fluxo da spec.

- [ ] **Step 1: Escrever o teste que falha**

```typescript
// packages/omie-data/src/application/consultar-produtos.test.ts
import { describe, expect, it } from "vitest";
import { abrirBanco } from "../infrastructure/database.js";
import { consultarProdutos } from "./consultar-produtos.js";

describe("consultarProdutos", () => {
  it("retorna status sem_dado quando view_produtos está vazia", () => {
    const db = abrirBanco(":memory:");

    const resultado = consultarProdutos(db);

    expect(resultado.status).toBe("sem_dado");
    expect(resultado.produtos).toEqual([]);
    expect(resultado.geradoEm).toBeNull();

    db.close();
  });

  it("retorna dado_disponivel com produtos e idade calculada quando view_produtos tem dado", () => {
    const db = abrirBanco(":memory:");
    const geradoEm = new Date(Date.now() - 60_000).toISOString(); // 1 min atrás

    db.prepare(`
      INSERT INTO view_produtos (codigo_produto, codigo, nome, categoria, unidade, valor_formatado, ativo, gerado_em)
      VALUES (1, 'A', 'Produto A', 'Cat X', 'UN', 'R$ 10,00', 'Sim', ?)
    `).run(geradoEm);

    const resultado = consultarProdutos(db);

    expect(resultado.status).toBe("dado_disponivel");
    expect(resultado.produtos).toHaveLength(1);
    expect(resultado.produtos[0].nome).toBe("Produto A");
    expect(resultado.geradoEm).toBe(geradoEm);
    expect(resultado.idadeMs).toBeGreaterThanOrEqual(60_000);

    db.close();
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npm --prefix packages/omie-data test -- consultar-produtos.test.ts`
Expected: FAIL com "Cannot find module './consultar-produtos.js'"

- [ ] **Step 3: Implementar `consultar-produtos.ts`**

```typescript
// packages/omie-data/src/application/consultar-produtos.ts
import type Database from "better-sqlite3";
import { ProdutoView } from "../domain/produto.js";

export interface ResultadoConsultaProdutos {
  status: "sem_dado" | "dado_disponivel";
  produtos: ProdutoView[];
  geradoEm: string | null;
  idadeMs: number | null;
}

export function consultarProdutos(db: Database.Database): ResultadoConsultaProdutos {
  const linhas = db
    .prepare(
      "SELECT codigo_produto, codigo, nome, categoria, unidade, valor_formatado, ativo, gerado_em FROM view_produtos"
    )
    .all() as Array<{
      codigo_produto: number;
      codigo: string;
      nome: string;
      categoria: string;
      unidade: string;
      valor_formatado: string;
      ativo: "Sim" | "Não";
      gerado_em: string;
    }>;

  if (linhas.length === 0) {
    return { status: "sem_dado", produtos: [], geradoEm: null, idadeMs: null };
  }

  const produtos: ProdutoView[] = linhas.map((linha) => ({
    codigoProduto: linha.codigo_produto,
    codigo: linha.codigo,
    nome: linha.nome,
    categoria: linha.categoria,
    unidade: linha.unidade,
    valorFormatado: linha.valor_formatado,
    ativo: linha.ativo,
  }));

  const geradoEm = linhas[0].gerado_em;
  const idadeMs = Date.now() - new Date(geradoEm).getTime();

  return { status: "dado_disponivel", produtos, geradoEm, idadeMs };
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npm --prefix packages/omie-data test -- consultar-produtos.test.ts`
Expected: PASS

- [ ] **Step 5: Rodar a suíte completa do pacote**

Run: `npm --prefix packages/omie-data test`
Expected: todos os testes de Tasks 3–7 PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/omie-data/src/application/consultar-produtos.ts packages/omie-data/src/application/consultar-produtos.test.ts
git commit -m "feat(omie-data): consultarProdutos com status e idade do dado (sem_dado | dado_disponivel)"
```

---

## Fora de escopo deste plano

- Cliente HTTP **real** pra API Omie (implementação de produção de `IOmieHttpClient`) e o passo de configuração/validação de credenciais (App Key/App Secret) — ficam pra um plano seguinte, já que dependem de decidir onde/como guardar segredo com segurança (fora do escopo de "só TDD do pipeline de dados").
- Comando de skill (`/omie-data:produtos`) que orquestra tudo isso e pergunta ao usuário se quer atualizar — depende deste pipeline estar pronto e testado primeiro.
- Demais módulos (estoque, pedidos etc.) — só depois do piloto Produtos validado.
