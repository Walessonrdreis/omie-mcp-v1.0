# Cache MCP — módulo de Ordem de Produção Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Pré-requisito:** o plano `docs/superpowers/plans/2026-08-07-pnpm-workspace-cleanup.md`
precisa estar concluído primeiro — este plano depende de `omie-data` já
estar disponível como `import ... from "omie-data"` na raiz.

**Goal:** Ordem de Produção vira o primeiro módulo do servidor MCP a usar o
`omie-data` como camada de dados compartilhada: uma ferramenta nova
(`omie_op_atualizar_cache`) grava/atualiza o cache local, e a ferramenta
existente `omie_op_listar_com_produto` passa a ler desse cache em vez de
bater na Omie a cada chamada.

**Architecture:** Segue exatamente o padrão Dado Bruto → Coleta → Tradução →
View → Consulta já estabelecido por Produtos/Estoque em `packages/omie-data`
(ver `packages/omie-data/CONTEXT.md`). O servidor raiz consome essas funções
via `import ... from "omie-data"`.

**Tech Stack:** TypeScript (NodeNext), Vitest, better-sqlite3, Zod, pnpm.

## Global Constraints

- TDD sempre nos arquivos de `packages/omie-data`: teste que falha → confirma
  falha → implementa → confirma passa → commit.
- **Exceção documentada:** os arquivos de "fiação" no servidor raiz que só
  conectam variável de ambiente + path de banco + registro de ferramenta MCP
  (`ordem-producao-tools.ts`) não têm teste unitário direto — não existe
  precedente disso em nenhum outro arquivo `*-tools.ts` deste repo (só os
  use-cases que eles chamam são testados). A lógica de negócio real fica
  inteira em `packages/omie-data` (testada) e em `op-cache.ts` (testado,
  ver Task 9). Esses dois arquivos de fiação são validados por build limpo +
  suíte completa + verificação manual documentada no próprio task.
- Um commit por task concluída.
- `collectOrdemProducao` nunca traduz — só grava o payload bruto.
- `translateOrdemProducao` nunca chama rede — só lê Dado Bruto e escreve a
  View.
- **Antes de implementar `listarOrdensProducaoPagina`** (Task 7), confirmar
  nomes de campo e formato de requisição/resposta contra
  `src/modules/ordemProducao/infrastructure/gateways/op-omie-gateway.ts` e
  `src/modules/ordemProducao/domain/interfaces/op-gateway.ts` (ambos no
  servidor raiz, já validados em produção) — nunca inventar a partir de doc
  pública. Mesma causa raiz do bug de HTTP 500 que o módulo de Estoque teve.
- Build (`npm run build` dentro de `packages/omie-data`; `pnpm run build` na
  raiz) + suíte completa (`npm test` dentro de `packages/omie-data`; `pnpm
  test` na raiz) antes de cada commit.
- Antes de `npm test` dentro de `packages/omie-data`, rodar `rm -rf dist`
  primeiro (achado de ambiente conhecido: `vitest.config.ts` não exclui
  `dist/` do glob de testes, artefatos de build antigos dobram a contagem).
- Instalar dependências sempre com `pnpm install` rodado na raiz (nunca `npm
  install` em `packages/omie-data` — ver plano de pré-requisito).

---

## Parte 1 — `packages/omie-data`: módulo de Ordem de Produção

### Task 1: Tipo de domínio `OrdemProducaoOmieBruta`

**Files:**
- Create: `packages/omie-data/src/modules/ordemProducao/domain/ordem-producao.ts`

**Interfaces:**
- Produces: `OrdemProducaoOmieBruta` — espelha exatamente
  `OrdemProducao` de `src/modules/ordemProducao/domain/interfaces/op-gateway.ts`
  (servidor raiz).

**Nota:** sem teste — é só tipo, sem comportamento (mesmo padrão de
`PosicaoEstoqueOmieBruta` no módulo de Estoque).

- [ ] **Step 1: Criar o arquivo**

```typescript
/** Ordem de Produção crua, como a API Omie devolve em ListarOrdemProducao. */
export interface OrdemProducaoOmieBruta {
  identificacao: {
    cCodIntOP: string;
    cNumOP: string;
    codigo_local_estoque: number;
    dDtPrevisao: string;
    nCodOP: number;
    nCodProduto: number;
    nQtde: number;
  };
  infAdicionais: {
    cEtapa: string;
    dDtConclusao: string;
    dDtInicio: string;
    nCodProjeto: number;
  };
  outrasInf: {
    cConcluida: "S" | "N";
    dConclusao: string;
    dInclusao: string;
  };
}
```

- [ ] **Step 2: Build + commit**

```bash
cd packages/omie-data
npm run build
git add src/modules/ordemProducao/domain/ordem-producao.ts
git commit -m "feat(omie-data): tipo OrdemProducaoOmieBruta"
```

---

### Task 2: `IOrdemProducaoHttpClient` + `FakeHttpClient` implementa

**Files:**
- Create: `packages/omie-data/src/domain/ordem-producao-http-client.ts`
- Modify: `packages/omie-data/src/infrastructure/fake-http-client.ts`
- Modify: `packages/omie-data/src/infrastructure/fake-http-client.test.ts`

**Interfaces:**
- Consumes: `OrdemProducaoOmieBruta` (Task 1).
- Produces: `IOrdemProducaoHttpClient.listarOrdensProducaoPagina(pagina, registrosPorPagina): Promise<ListarOrdemProducaoResponseBruto>`;
  `FakeHttpClient` construtor ganha um 3º parâmetro opcional
  `ordensProducao: OrdemProducaoOmieBruta[] = []`.

- [ ] **Step 1: Criar `domain/ordem-producao-http-client.ts`**

```typescript
import { OrdemProducaoOmieBruta } from "../modules/ordemProducao/domain/ordem-producao.js";

export interface ListarOrdemProducaoResponseBruto {
  pagina: number;
  total_de_paginas: number;
  registros: number;
  total_de_registros: number;
  cadastros: OrdemProducaoOmieBruta[];
}

export interface IOrdemProducaoHttpClient {
  listarOrdensProducaoPagina(
    pagina: number,
    registrosPorPagina: number
  ): Promise<ListarOrdemProducaoResponseBruto>;
}
```

- [ ] **Step 2: Escrever o teste que falha em `fake-http-client.test.ts`**

Adicione ao arquivo (mantendo os testes existentes de produtos/estoque):

```typescript
import { OrdemProducaoOmieBruta } from "../modules/ordemProducao/domain/ordem-producao.js";

// dentro do describe("FakeHttpClient", ...):
it("pagina ordens de produção", async () => {
  const ordens: OrdemProducaoOmieBruta[] = [
    {
      identificacao: {
        cCodIntOP: "", cNumOP: "2024/00001", codigo_local_estoque: 1,
        dDtPrevisao: "01/01/2024", nCodOP: 100, nCodProduto: 1, nQtde: 10,
      },
      infAdicionais: { cEtapa: "80", dDtConclusao: "01/01/2024", dDtInicio: "01/01/2024", nCodProjeto: 0 },
      outrasInf: { cConcluida: "S", dConclusao: "01/01/2024", dInclusao: "01/01/2024" },
    },
    {
      identificacao: {
        cCodIntOP: "", cNumOP: "2024/00002", codigo_local_estoque: 1,
        dDtPrevisao: "02/01/2024", nCodOP: 200, nCodProduto: 2, nQtde: 20,
      },
      infAdicionais: { cEtapa: "80", dDtConclusao: "", dDtInicio: "02/01/2024", nCodProjeto: 0 },
      outrasInf: { cConcluida: "N", dConclusao: "", dInclusao: "02/01/2024" },
    },
  ];
  const client = new FakeHttpClient([], [], ordens);

  const pagina1 = await client.listarOrdensProducaoPagina(1, 1);

  expect(pagina1.pagina).toBe(1);
  expect(pagina1.total_de_paginas).toBe(2);
  expect(pagina1.total_de_registros).toBe(2);
  expect(pagina1.cadastros).toHaveLength(1);
  expect(pagina1.cadastros[0].identificacao.nCodOP).toBe(100);
});
```

- [ ] **Step 3: Rodar o teste e confirmar que falha**

Run: `cd packages/omie-data && npx vitest run fake-http-client.test.ts`
Expected: FAIL — `FakeHttpClient` não tem `listarOrdensProducaoPagina`, ou o construtor não aceita 3 argumentos.

- [ ] **Step 4: Atualizar `FakeHttpClient`**

```typescript
import { IProdutosHttpClient, ListarProdutosResponseBruto } from "../domain/produtos-http-client.js";
import { ProdutoOmieBruto } from "../modules/produtos/domain/produto.js";
import { IEstoqueHttpClient, ListarPosEstoqueResponseBruto } from "../domain/estoque-http-client.js";
import { PosicaoEstoqueOmieBruta } from "../modules/estoque/domain/estoque.js";
import { IOrdemProducaoHttpClient, ListarOrdemProducaoResponseBruto } from "../domain/ordem-producao-http-client.js";
import { OrdemProducaoOmieBruta } from "../modules/ordemProducao/domain/ordem-producao.js";

export class FakeHttpClient implements IProdutosHttpClient, IEstoqueHttpClient, IOrdemProducaoHttpClient {
  constructor(
    private readonly produtos: ProdutoOmieBruto[] = [],
    private readonly posicoesEstoque: PosicaoEstoqueOmieBruta[] = [],
    private readonly ordensProducao: OrdemProducaoOmieBruta[] = []
  ) {}

  // ... listarProdutosPagina e listarPosicoesEstoquePagina continuam iguais ...

  async listarOrdensProducaoPagina(
    pagina: number,
    registrosPorPagina: number
  ): Promise<ListarOrdemProducaoResponseBruto> {
    const inicio = (pagina - 1) * registrosPorPagina;
    const fatia = this.ordensProducao.slice(inicio, inicio + registrosPorPagina);
    const totalPaginas = Math.max(1, Math.ceil(this.ordensProducao.length / registrosPorPagina));

    return {
      pagina,
      total_de_paginas: totalPaginas,
      registros: fatia.length,
      total_de_registros: this.ordensProducao.length,
      cadastros: fatia,
    };
  }
}
```

- [ ] **Step 5: Rodar o teste e confirmar que passa**

Run: `npx vitest run fake-http-client.test.ts`
Expected: PASS (todos os testes, produtos + estoque + OP).

- [ ] **Step 6: Suíte completa + build + commit**

```bash
rm -rf dist && npm test
npm run build
git add src/domain/ordem-producao-http-client.ts src/infrastructure/fake-http-client.ts src/infrastructure/fake-http-client.test.ts
git commit -m "feat(omie-data): IOrdemProducaoHttpClient + FakeHttpClient paginando OPs"
```

---

### Task 3: Schema — `raw_ordens_producao` + `view_ordens_producao`

**Files:**
- Modify: `packages/omie-data/src/infrastructure/database.ts`
- Modify: `packages/omie-data/src/infrastructure/database.test.ts`

**What changes:**
- `raw_ordens_producao`: `codigo_op INTEGER PRIMARY KEY, payload_json TEXT NOT NULL, coletado_em TEXT NOT NULL` (PK simples — cada OP é uma linha única, ao contrário de estoque que tem posição por local).
- `view_ordens_producao`: `codigo_op INTEGER PRIMARY KEY, numero_op TEXT NOT NULL, codigo_produto INTEGER NOT NULL, codigo_sku TEXT NOT NULL, descricao_produto TEXT NOT NULL, quantidade REAL NOT NULL, data_previsao TEXT NOT NULL, data_inicio TEXT NOT NULL, data_conclusao TEXT NOT NULL, concluida INTEGER NOT NULL DEFAULT 0, etapa_codigo TEXT NOT NULL, gerado_em TEXT NOT NULL`.

- [ ] **Step 1: Escrever o teste que falha**

Adicione a `database.test.ts`:

```typescript
it("cria a tabela raw_ordens_producao com PK simples", () => {
  const db = abrirBanco(":memory:");
  const tabelas = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((l: any) => l.name);
  expect(tabelas).toContain("raw_ordens_producao");

  const cols = db.prepare("PRAGMA table_info(raw_ordens_producao)").all() as any[];
  const nomes = cols.map((c: any) => c.name);
  expect(nomes).toContain("codigo_op");
  expect(nomes).toContain("payload_json");
  expect(nomes).toContain("coletado_em");

  db.close();
});

it("cria a tabela view_ordens_producao com todas as colunas", () => {
  const db = abrirBanco(":memory:");
  const cols = db.prepare("PRAGMA table_info(view_ordens_producao)").all() as any[];
  const nomes = cols.map((c: any) => c.name);
  expect(nomes).toEqual([
    "codigo_op", "numero_op", "codigo_produto", "codigo_sku", "descricao_produto",
    "quantidade", "data_previsao", "data_inicio", "data_conclusao", "concluida",
    "etapa_codigo", "gerado_em",
  ]);
  db.close();
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run database.test.ts`
Expected: FAIL — as duas tabelas não existem.

- [ ] **Step 3: Implementar em `database.ts`**

Adicione dentro do `db.exec(...)` já existente, depois da criação de `raw_estoque`:

```sql
    CREATE TABLE IF NOT EXISTS raw_ordens_producao (
      codigo_op INTEGER PRIMARY KEY,
      payload_json TEXT NOT NULL,
      coletado_em TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS view_ordens_producao (
      codigo_op INTEGER PRIMARY KEY,
      numero_op TEXT NOT NULL,
      codigo_produto INTEGER NOT NULL,
      codigo_sku TEXT NOT NULL,
      descricao_produto TEXT NOT NULL,
      quantidade REAL NOT NULL,
      data_previsao TEXT NOT NULL,
      data_inicio TEXT NOT NULL,
      data_conclusao TEXT NOT NULL,
      concluida INTEGER NOT NULL DEFAULT 0,
      etapa_codigo TEXT NOT NULL,
      gerado_em TEXT NOT NULL
    );
```

(Tabelas novas, sem coluna pré-existente — não precisa do dança de `ALTER TABLE` que `view_produtos` teve.)

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run database.test.ts`
Expected: PASS.

- [ ] **Step 5: Suíte completa + build + commit**

```bash
rm -rf dist && npm test
npm run build
git add src/infrastructure/database.ts src/infrastructure/database.test.ts
git commit -m "feat(omie-data): schema raw_ordens_producao + view_ordens_producao"
```

---

### Task 4: `collectOrdemProducao`

**Files:**
- Create: `packages/omie-data/src/modules/ordemProducao/application/collect-op.ts`
- Create: `packages/omie-data/src/modules/ordemProducao/application/collect-op.test.ts`

**Interfaces:**
- Consumes: `IOrdemProducaoHttpClient` (Task 2).
- Produces: `async function collectOrdemProducao(db: Database.Database, client: IOrdemProducaoHttpClient, esperaEntrePaginasMs?: number): Promise<number>`.

- [ ] **Step 1: Escrever o teste que falha**

```typescript
import { describe, expect, it } from "vitest";
import { abrirBanco } from "../../../infrastructure/database.js";
import { FakeHttpClient } from "../../../infrastructure/fake-http-client.js";
import { OrdemProducaoOmieBruta } from "../domain/ordem-producao.js";
import { collectOrdemProducao } from "./collect-op.js";

function criarOp(nCodOP: number): OrdemProducaoOmieBruta {
  return {
    identificacao: {
      cCodIntOP: "", cNumOP: `2024/${nCodOP}`, codigo_local_estoque: 1,
      dDtPrevisao: "01/01/2024", nCodOP, nCodProduto: 1, nQtde: 10,
    },
    infAdicionais: { cEtapa: "80", dDtConclusao: "01/01/2024", dDtInicio: "01/01/2024", nCodProjeto: 0 },
    outrasInf: { cConcluida: "S", dConclusao: "01/01/2024", dInclusao: "01/01/2024" },
  };
}

describe("collectOrdemProducao", () => {
  it("grava cada OP em raw_ordens_producao com payload bruto", async () => {
    const db = abrirBanco(":memory:");
    const client = new FakeHttpClient([], [], [criarOp(100)]);

    const total = await collectOrdemProducao(db, client);

    expect(total).toBe(1);

    const linha = db.prepare(
      "SELECT codigo_op, payload_json, coletado_em FROM raw_ordens_producao WHERE codigo_op = 100"
    ).get() as any;

    expect(linha.codigo_op).toBe(100);
    expect(JSON.parse(linha.payload_json).identificacao.nQtde).toBe(10);
    expect(linha.coletado_em).toBeTruthy();

    db.close();
  });

  it("faz upsert: mesma OP rodada duas vezes não duplica", async () => {
    const db = abrirBanco(":memory:");
    const client = new FakeHttpClient([], [], [criarOp(100)]);

    await collectOrdemProducao(db, client);
    await collectOrdemProducao(db, client);

    const linhas = db.prepare("SELECT COUNT(*) as total FROM raw_ordens_producao").get() as { total: number };
    expect(linhas.total).toBe(1);

    db.close();
  });

  it("aguarda entre páginas quando há mais de uma", async () => {
    const db = abrirBanco(":memory:");
    const ordens = Array.from({ length: 150 }, (_, i) => criarOp(i + 1));
    const client = new FakeHttpClient([], [], ordens);

    const total = await collectOrdemProducao(db, client, 0); // sem espera no teste

    expect(total).toBe(150);
    db.close();
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run collect-op.test.ts`
Expected: FAIL — `Cannot find module './collect-op.js'`.

- [ ] **Step 3: Implementar `collect-op.ts`**

```typescript
import type Database from "better-sqlite3";
import { IOrdemProducaoHttpClient } from "../../../domain/ordem-producao-http-client.js";

const REGISTROS_POR_PAGINA = 100;
const TETO_PAGINAS = 1000;
const ESPERA_ENTRE_PAGINAS_MS = 200;

function aguardar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function collectOrdemProducao(
  db: Database.Database,
  client: IOrdemProducaoHttpClient,
  esperaEntrePaginasMs: number = ESPERA_ENTRE_PAGINAS_MS
): Promise<number> {
  const upsert = db.prepare(`
    INSERT INTO raw_ordens_producao (codigo_op, payload_json, coletado_em)
    VALUES (@codigo_op, @payload_json, @coletado_em)
    ON CONFLICT(codigo_op) DO UPDATE SET
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

    const resposta = await client.listarOrdensProducaoPagina(pagina, REGISTROS_POR_PAGINA);
    totalPaginas = Math.min(resposta.total_de_paginas, TETO_PAGINAS);

    for (const op of resposta.cadastros) {
      upsert.run({
        codigo_op: op.identificacao.nCodOP,
        payload_json: JSON.stringify(op),
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

Run: `npx vitest run collect-op.test.ts`
Expected: PASS.

- [ ] **Step 5: Suíte completa + build + commit**

```bash
rm -rf dist && npm test
npm run build
git add src/modules/ordemProducao/application/collect-op.ts src/modules/ordemProducao/application/collect-op.test.ts
git commit -m "feat(omie-data): collectOrdemProducao grava OPs em raw_ordens_producao"
```

---

### Task 5: `translateOrdemProducao`

**Files:**
- Create: `packages/omie-data/src/modules/ordemProducao/application/translate-op.ts`
- Create: `packages/omie-data/src/modules/ordemProducao/application/translate-op.test.ts`

**Interfaces:**
- Consumes: `OrdemProducaoOmieBruta` (Task 1), `ProdutoOmieBruto` (já existe em `../../produtos/domain/produto.js`).
- Produces: `function translateOrdemProducao(db: Database.Database): number`.

**What it does:** lê `raw_ordens_producao` + `raw_produtos`, junta por
`identificacao.nCodProduto` ↔ `codigo_produto`, grava `view_ordens_producao`.
Produto não encontrado no cache de produtos vira `"(produto não encontrado)"`
(mesmo texto que `ListarOpsComProdutoUseCase` já usa hoje no servidor raiz,
pra manter familiaridade). `cConcluida: "S"/"N"` vira `1`/`0` na coluna
`concluida`.

- [ ] **Step 1: Escrever os testes que falham**

```typescript
import { describe, expect, it } from "vitest";
import { abrirBanco } from "../../../infrastructure/database.js";
import { translateOrdemProducao } from "./translate-op.js";

function inserirProduto(db: any, codigo: number, codigoTexto: string, descricao: string) {
  db.prepare(
    "INSERT INTO raw_produtos (codigo_produto, payload_json, coletado_em) VALUES (?, ?, ?)"
  ).run(
    codigo,
    JSON.stringify({
      codigo_produto: codigo, codigo: codigoTexto, descricao, unidade: "UN",
      valor_unitario: 10, inativo: "N", codigo_familia: 1,
    }),
    new Date().toISOString()
  );
}

function inserirOpBruta(db: any, nCodOP: number, nCodProduto: number, cConcluida: "S" | "N") {
  db.prepare(
    "INSERT INTO raw_ordens_producao (codigo_op, payload_json, coletado_em) VALUES (?, ?, ?)"
  ).run(
    nCodOP,
    JSON.stringify({
      identificacao: {
        cCodIntOP: "", cNumOP: `2024/${nCodOP}`, codigo_local_estoque: 1,
        dDtPrevisao: "01/01/2024", nCodOP, nCodProduto, nQtde: 25,
      },
      infAdicionais: { cEtapa: "80", dDtConclusao: "02/01/2024", dDtInicio: "01/01/2024", nCodProjeto: 0 },
      outrasInf: { cConcluida, dConclusao: "02/01/2024", dInclusao: "01/01/2024" },
    }),
    new Date().toISOString()
  );
}

describe("translateOrdemProducao", () => {
  it("faz join com raw_produtos e traz descrição/SKU do produto", () => {
    const db = abrirBanco(":memory:");
    inserirProduto(db, 1, "SKU-A", "Produto A");
    inserirOpBruta(db, 100, 1, "S");

    translateOrdemProducao(db);

    const view = db.prepare("SELECT * FROM view_ordens_producao WHERE codigo_op = 100").get() as any;
    expect(view.numero_op).toBe("2024/100");
    expect(view.codigo_produto).toBe(1);
    expect(view.codigo_sku).toBe("SKU-A");
    expect(view.descricao_produto).toBe("Produto A");
    expect(view.quantidade).toBe(25);
    expect(view.concluida).toBe(1);
    expect(view.etapa_codigo).toBe("80");

    db.close();
  });

  it("produto não encontrado no cache vira fallback legível", () => {
    const db = abrirBanco(":memory:");
    inserirOpBruta(db, 200, 999, "N");

    translateOrdemProducao(db);

    const view = db.prepare("SELECT * FROM view_ordens_producao WHERE codigo_op = 200").get() as any;
    expect(view.codigo_sku).toBe("");
    expect(view.descricao_produto).toBe("(produto não encontrado)");
    expect(view.concluida).toBe(0);

    db.close();
  });
});
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npx vitest run translate-op.test.ts`
Expected: FAIL — `Cannot find module './translate-op.js'`.

- [ ] **Step 3: Implementar `translate-op.ts`**

```typescript
import type Database from "better-sqlite3";
import { OrdemProducaoOmieBruta } from "../domain/ordem-producao.js";
import { ProdutoOmieBruto } from "../../produtos/domain/produto.js";

export function translateOrdemProducao(db: Database.Database): number {
  const produtosBrutos = db
    .prepare("SELECT payload_json FROM raw_produtos")
    .all() as { payload_json: string }[];

  const produtoPorCodigo = new Map<number, { codigo: string; descricao: string }>();
  for (const linha of produtosBrutos) {
    const produto = JSON.parse(linha.payload_json) as ProdutoOmieBruto;
    produtoPorCodigo.set(produto.codigo_produto, {
      codigo: produto.codigo ?? String(produto.codigo_produto),
      descricao: produto.descricao ?? "(sem nome)",
    });
  }

  const brutos = db
    .prepare("SELECT payload_json FROM raw_ordens_producao")
    .all() as { payload_json: string }[];

  const upsert = db.prepare(`
    INSERT INTO view_ordens_producao (
      codigo_op, numero_op, codigo_produto, codigo_sku, descricao_produto,
      quantidade, data_previsao, data_inicio, data_conclusao, concluida, etapa_codigo, gerado_em
    )
    VALUES (
      @codigo_op, @numero_op, @codigo_produto, @codigo_sku, @descricao_produto,
      @quantidade, @data_previsao, @data_inicio, @data_conclusao, @concluida, @etapa_codigo, @gerado_em
    )
    ON CONFLICT(codigo_op) DO UPDATE SET
      numero_op = excluded.numero_op,
      codigo_produto = excluded.codigo_produto,
      codigo_sku = excluded.codigo_sku,
      descricao_produto = excluded.descricao_produto,
      quantidade = excluded.quantidade,
      data_previsao = excluded.data_previsao,
      data_inicio = excluded.data_inicio,
      data_conclusao = excluded.data_conclusao,
      concluida = excluded.concluida,
      etapa_codigo = excluded.etapa_codigo,
      gerado_em = excluded.gerado_em
  `);

  const agora = new Date().toISOString();
  let total = 0;

  for (const linha of brutos) {
    const op = JSON.parse(linha.payload_json) as OrdemProducaoOmieBruta;
    const produto = produtoPorCodigo.get(op.identificacao.nCodProduto);

    upsert.run({
      codigo_op: op.identificacao.nCodOP,
      numero_op: op.identificacao.cNumOP,
      codigo_produto: op.identificacao.nCodProduto,
      codigo_sku: produto?.codigo ?? "",
      descricao_produto: produto?.descricao ?? "(produto não encontrado)",
      quantidade: op.identificacao.nQtde,
      data_previsao: op.identificacao.dDtPrevisao,
      data_inicio: op.infAdicionais.dDtInicio,
      data_conclusao: op.infAdicionais.dDtConclusao,
      concluida: op.outrasInf.cConcluida === "S" ? 1 : 0,
      etapa_codigo: op.infAdicionais.cEtapa,
      gerado_em: agora,
    });
    total++;
  }

  return total;
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npx vitest run translate-op.test.ts`
Expected: PASS (2/2).

- [ ] **Step 5: Suíte completa + build + commit**

```bash
rm -rf dist && npm test
npm run build
git add src/modules/ordemProducao/application/translate-op.ts src/modules/ordemProducao/application/translate-op.test.ts
git commit -m "feat(omie-data): translateOrdemProducao junta raw_ordens_producao com raw_produtos"
```

---

### Task 6: `consultarOrdensProducao`

**Files:**
- Create: `packages/omie-data/src/modules/ordemProducao/application/consultar-op.ts`
- Create: `packages/omie-data/src/modules/ordemProducao/application/consultar-op.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  export interface OrdemProducaoView {
    codigoOp: number;
    numeroOp: string;
    codigoProduto: number;
    codigoSku: string;
    descricaoProduto: string;
    quantidade: number;
    dataPrevisao: string;
    dataInicio: string;
    dataConclusao: string;
    concluida: boolean;
    etapaCodigo: string;
  }

  export interface FiltrosOrdensProducao {
    apenasNaoConcluidas?: boolean;
  }

  export interface ResultadoConsultaOrdensProducao {
    status: "sem_dado" | "dado_disponivel";
    ordens: OrdemProducaoView[];
    geradoEm: string | null;
    idadeMs: number | null;
  }

  export function consultarOrdensProducao(
    db: Database.Database,
    filtros?: FiltrosOrdensProducao
  ): ResultadoConsultaOrdensProducao
  ```

- [ ] **Step 1: Escrever os testes que falham**

```typescript
import { describe, expect, it } from "vitest";
import { abrirBanco } from "../../../infrastructure/database.js";
import { consultarOrdensProducao } from "./consultar-op.js";

function inserirViewOp(db: any, codigoOp: number, concluida: 0 | 1, geradoEm: string) {
  db.prepare(`
    INSERT INTO view_ordens_producao (
      codigo_op, numero_op, codigo_produto, codigo_sku, descricao_produto,
      quantidade, data_previsao, data_inicio, data_conclusao, concluida, etapa_codigo, gerado_em
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(codigoOp, `2024/${codigoOp}`, 1, "SKU-A", "Produto A", 10, "01/01/2024", "01/01/2024", "02/01/2024", concluida, "80", geradoEm);
}

describe("consultarOrdensProducao", () => {
  it("retorna status sem_dado quando view_ordens_producao está vazia", () => {
    const db = abrirBanco(":memory:");

    const resultado = consultarOrdensProducao(db);

    expect(resultado.status).toBe("sem_dado");
    expect(resultado.ordens).toEqual([]);
    expect(resultado.geradoEm).toBeNull();
    expect(resultado.idadeMs).toBeNull();

    db.close();
  });

  it("retorna dado_disponivel com ordens e idade calculada", () => {
    const db = abrirBanco(":memory:");
    const geradoEm = new Date(Date.now() - 60_000).toISOString();
    inserirViewOp(db, 100, 1, geradoEm);

    const resultado = consultarOrdensProducao(db);

    expect(resultado.status).toBe("dado_disponivel");
    expect(resultado.ordens).toHaveLength(1);
    expect(resultado.ordens[0].codigoOp).toBe(100);
    expect(resultado.ordens[0].concluida).toBe(true);
    expect(resultado.geradoEm).toBe(geradoEm);
    expect(resultado.idadeMs).toBeGreaterThanOrEqual(60_000);

    db.close();
  });

  it("filtro apenasNaoConcluidas remove OPs concluídas", () => {
    const db = abrirBanco(":memory:");
    const agora = new Date().toISOString();
    inserirViewOp(db, 100, 1, agora); // concluída
    inserirViewOp(db, 200, 0, agora); // não concluída

    const resultado = consultarOrdensProducao(db, { apenasNaoConcluidas: true });

    expect(resultado.ordens).toHaveLength(1);
    expect(resultado.ordens[0].codigoOp).toBe(200);
    expect(resultado.ordens[0].concluida).toBe(false);

    db.close();
  });
});
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npx vitest run consultar-op.test.ts`
Expected: FAIL — `Cannot find module './consultar-op.js'`.

- [ ] **Step 3: Implementar `consultar-op.ts`**

```typescript
import type Database from "better-sqlite3";

export interface OrdemProducaoView {
  codigoOp: number;
  numeroOp: string;
  codigoProduto: number;
  codigoSku: string;
  descricaoProduto: string;
  quantidade: number;
  dataPrevisao: string;
  dataInicio: string;
  dataConclusao: string;
  concluida: boolean;
  etapaCodigo: string;
}

export interface FiltrosOrdensProducao {
  apenasNaoConcluidas?: boolean;
}

export interface ResultadoConsultaOrdensProducao {
  status: "sem_dado" | "dado_disponivel";
  ordens: OrdemProducaoView[];
  geradoEm: string | null;
  idadeMs: number | null;
}

export function consultarOrdensProducao(
  db: Database.Database,
  filtros?: FiltrosOrdensProducao
): ResultadoConsultaOrdensProducao {
  const condicoes: string[] = [];
  if (filtros?.apenasNaoConcluidas) {
    condicoes.push("concluida = 0");
  }
  const where = condicoes.length > 0 ? `WHERE ${condicoes.join(" AND ")}` : "";

  const linhas = db
    .prepare(
      `SELECT codigo_op, numero_op, codigo_produto, codigo_sku, descricao_produto, quantidade, data_previsao, data_inicio, data_conclusao, concluida, etapa_codigo, gerado_em FROM view_ordens_producao ${where} ORDER BY gerado_em DESC`
    )
    .all() as Array<{
      codigo_op: number;
      numero_op: string;
      codigo_produto: number;
      codigo_sku: string;
      descricao_produto: string;
      quantidade: number;
      data_previsao: string;
      data_inicio: string;
      data_conclusao: string;
      concluida: number;
      etapa_codigo: string;
      gerado_em: string;
    }>;

  if (linhas.length === 0) {
    return { status: "sem_dado", ordens: [], geradoEm: null, idadeMs: null };
  }

  const ordens: OrdemProducaoView[] = linhas.map((linha) => ({
    codigoOp: linha.codigo_op,
    numeroOp: linha.numero_op,
    codigoProduto: linha.codigo_produto,
    codigoSku: linha.codigo_sku,
    descricaoProduto: linha.descricao_produto,
    quantidade: linha.quantidade,
    dataPrevisao: linha.data_previsao,
    dataInicio: linha.data_inicio,
    dataConclusao: linha.data_conclusao,
    concluida: linha.concluida === 1,
    etapaCodigo: linha.etapa_codigo,
  }));

  const geradoEm = linhas[0].gerado_em;
  const idadeMs = Date.now() - new Date(geradoEm).getTime();

  return { status: "dado_disponivel", ordens, geradoEm, idadeMs };
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npx vitest run consultar-op.test.ts`
Expected: PASS (3/3).

- [ ] **Step 5: Suíte completa + build + commit**

```bash
rm -rf dist && npm test
npm run build
git add src/modules/ordemProducao/application/consultar-op.ts src/modules/ordemProducao/application/consultar-op.test.ts
git commit -m "feat(omie-data): consultarOrdensProducao lê view_ordens_producao com filtro apenasNaoConcluidas"
```

---

### Task 7: `OmieHttpClientReal.listarOrdensProducaoPagina`

**Files:**
- Modify: `packages/omie-data/src/infrastructure/http-client-real.ts`
- Modify: `packages/omie-data/src/infrastructure/http-client-real.test.ts`

**Antes de codar:** abra e confirme, no servidor raiz (não neste pacote):
`src/modules/ordemProducao/infrastructure/gateways/op-omie-gateway.ts` — o
método `listarOrdensPagina` usa `resource: "produtos/op"`, `call:
"ListarOrdemProducao"`, `param: { pagina, registros_por_pagina:
registrosPorPagina }` (sem nomes de campo diferentes, ao contrário do que
aconteceu com Estoque — mas confirme você mesmo antes de prosseguir, é
regra do plano, não confie só neste texto).

**Interfaces:**
- Consumes: `IOrdemProducaoHttpClient`, `ListarOrdemProducaoResponseBruto` (Task 2).
- Produces: `OmieHttpClientReal` passa a implementar `IOrdemProducaoHttpClient` também.

- [ ] **Step 1: Escrever o teste que falha**

Adicione a `http-client-real.test.ts` (novo `describe`, no fim do arquivo):

```typescript
describe("OmieHttpClientReal — listarOrdensProducaoPagina", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("monta a URL e o payload corretos e devolve o JSON da resposta", async () => {
    const respostaFake = {
      pagina: 1,
      total_de_paginas: 1,
      registros: 1,
      total_de_registros: 1,
      cadastros: [
        {
          identificacao: {
            cCodIntOP: "", cNumOP: "2024/00100", codigo_local_estoque: 1,
            dDtPrevisao: "01/01/2024", nCodOP: 100, nCodProduto: 1, nQtde: 10,
          },
          infAdicionais: { cEtapa: "80", dDtConclusao: "01/01/2024", dDtInicio: "01/01/2024", nCodProjeto: 0 },
          outrasInf: { cConcluida: "S", dConclusao: "01/01/2024", dInclusao: "01/01/2024" },
        },
      ],
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(respostaFake),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new OmieHttpClientReal("minha-key", "meu-secret");
    const resultado = await client.listarOrdensProducaoPagina(1, 50);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opcoes] = fetchMock.mock.calls[0];
    expect(url).toBe("https://app.omie.com.br/api/v1/produtos/op/");
    const corpo = JSON.parse(opcoes.body);
    expect(corpo.call).toBe("ListarOrdemProducao");
    expect(corpo.app_key).toBe("minha-key");
    expect(corpo.app_secret).toBe("meu-secret");
    expect(corpo.param).toEqual([{ pagina: 1, registros_por_pagina: 50 }]);

    expect(resultado).toEqual(respostaFake);
  });

  it("rejeita com mensagem legível quando a Omie devolve faultstring", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ faultstring: "Erro de autenticação", faultcode: "SOAP-ENV:Client-101" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new OmieHttpClientReal("key-invalida", "secret-invalido");

    await expect(client.listarOrdensProducaoPagina(1, 50)).rejects.toThrow("Erro de autenticação");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("tenta de novo em erro 5xx e desiste depois de 3 tentativas", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => "Service Unavailable",
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new OmieHttpClientReal("minha-key", "meu-secret");

    await expect(client.listarOrdensProducaoPagina(1, 50)).rejects.toThrow(/503/);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run http-client-real.test.ts`
Expected: FAIL — `client.listarOrdensProducaoPagina is not a function`.

- [ ] **Step 3: Implementar em `http-client-real.ts`**

Adicione o import no topo:

```typescript
import { IOrdemProducaoHttpClient, ListarOrdemProducaoResponseBruto } from "../domain/ordem-producao-http-client.js";
```

Atualize a declaração da classe:

```typescript
export class OmieHttpClientReal implements IProdutosHttpClient, IEstoqueHttpClient, IOrdemProducaoHttpClient {
```

Adicione o método (mesmo padrão de `listarPosicoesEstoquePagina`, mudando endpoint/call/payload):

```typescript
  async listarOrdensProducaoPagina(
    pagina: number,
    registrosPorPagina: number
  ): Promise<ListarOrdemProducaoResponseBruto> {
    let ultimoErro: Error = new Error("Falha desconhecida ao chamar a API Omie");

    for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
      const response = await fetch(`${OMIE_BASE_URL}/produtos/op/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          call: "ListarOrdemProducao",
          app_key: this.appKey,
          app_secret: this.appSecret,
          param: [
            {
              pagina,
              registros_por_pagina: registrosPorPagina,
            },
          ],
        }),
      });

      if (!response.ok) {
        ultimoErro = new Error(`API Omie respondeu HTTP ${response.status}`);
        if (response.status >= 500 && tentativa < MAX_TENTATIVAS) {
          await aguardar(ESPERA_ENTRE_TENTATIVAS_MS);
          continue;
        }
        throw ultimoErro;
      }

      const texto = await response.text();
      let json: unknown;
      try {
        json = JSON.parse(texto);
      } catch {
        throw new Error(`API Omie devolveu resposta inválida (não é JSON): ${texto.slice(0, 200)}`);
      }

      if (json && typeof json === "object" && ("faultstring" in json || "faultcode" in json)) {
        const falha = json as { faultstring?: string };
        throw new Error(falha.faultstring ?? "Erro desconhecido na API Omie");
      }

      return json as ListarOrdemProducaoResponseBruto;
    }

    throw ultimoErro;
  }
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run http-client-real.test.ts`
Expected: PASS (todos os testes, produtos + estoque + OP).

- [ ] **Step 5: Suíte completa + build + commit**

```bash
rm -rf dist && npm test
npm run build
git add src/infrastructure/http-client-real.ts src/infrastructure/http-client-real.test.ts
git commit -m "feat(omie-data): OmieHttpClientReal.listarOrdensProducaoPagina"
```

---

### Task 8: Exportar API pública de `omie-data`

**Files:**
- Modify: `packages/omie-data/src/index.ts`

**What changes:** o arquivo hoje só tem `export { abrirBanco } from
"./infrastructure/database.js";` (adicionado pelo plano de pré-requisito).
Este task acrescenta todo o resto que o servidor raiz vai precisar.

- [ ] **Step 1: Atualizar `src/index.ts`**

```typescript
export { abrirBanco } from "./infrastructure/database.js";
export { diretorioDados } from "./infrastructure/caminhos.js";
export { hashCredencial } from "./infrastructure/credenciais.js";
export { OmieHttpClientReal } from "./infrastructure/http-client-real.js";
export { collectOrdemProducao } from "./modules/ordemProducao/application/collect-op.js";
export { translateOrdemProducao } from "./modules/ordemProducao/application/translate-op.js";
export {
  consultarOrdensProducao,
  type FiltrosOrdensProducao,
  type OrdemProducaoView,
  type ResultadoConsultaOrdensProducao,
} from "./modules/ordemProducao/application/consultar-op.js";
export type { IOrdemProducaoHttpClient } from "./domain/ordem-producao-http-client.js";
```

- [ ] **Step 2: Build e confirmar que `dist/index.d.ts` tem todos os exports**

Run: `rm -rf dist && npm run build`
Expected: sem erros. Confirme com `grep -c "export" dist/index.d.ts` — deve
mostrar mais de uma linha de export.

- [ ] **Step 3: Suíte completa + commit**

```bash
npm test
git add src/index.ts
git commit -m "feat(omie-data): exportar API pública (OP + helpers de credencial/banco)"
```

---

## Parte 2 — servidor raiz: conectar o cache no MCP

### Task 9: Helper de conexão com o banco ativo (`op-cache.ts`)

**Files:**
- Create: `src/modules/ordemProducao/infrastructure/cache/op-cache.ts`
- Create: `src/modules/ordemProducao/infrastructure/cache/op-cache.test.ts`

**Interfaces:**
- Consumes: `diretorioDados`, `hashCredencial`, `abrirBanco` (todos de `omie-data`, Task 8).
- Produces:
  ```typescript
  export function caminhoBancoAtivo(appKey: string): string;
  export interface CredenciaisOmie { appKey: string; appSecret: string; }
  export function credenciaisOmieOuFalha(): CredenciaisOmie;
  export function abrirBancoAtivo(appKey: string): Database.Database;
  ```

**Nota:** só `caminhoBancoAtivo` e `credenciaisOmieOuFalha` são testados
diretamente (funções puras, sem I/O real além do que `diretorioDados`/
`hashCredencial` já fazem). `abrirBancoAtivo` abre um banco de verdade — é
exercitada indiretamente pelas Tasks 10/11 via smoke test manual.

- [ ] **Step 1: Escrever os testes que falham**

```typescript
import { afterEach, describe, expect, it, vi } from "vitest";
import { caminhoBancoAtivo, credenciaisOmieOuFalha } from "./op-cache.js";

describe("caminhoBancoAtivo", () => {
  it("gera o mesmo caminho de banco pra uma mesma app key (determinístico)", () => {
    const caminho1 = caminhoBancoAtivo("minha-app-key");
    const caminho2 = caminhoBancoAtivo("minha-app-key");
    expect(caminho1).toBe(caminho2);
  });

  it("gera caminhos diferentes pra app keys diferentes", () => {
    const caminhoA = caminhoBancoAtivo("app-key-a");
    const caminhoB = caminhoBancoAtivo("app-key-b");
    expect(caminhoA).not.toBe(caminhoB);
  });

  it("caminho termina em .db", () => {
    expect(caminhoBancoAtivo("qualquer-key")).toMatch(/\.db$/);
  });
});

describe("credenciaisOmieOuFalha", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("devolve appKey e appSecret quando ambos estão definidos", () => {
    vi.stubEnv("OMIE_APP_KEY", "chave-teste");
    vi.stubEnv("OMIE_APP_SECRET", "segredo-teste");

    const credenciais = credenciaisOmieOuFalha();

    expect(credenciais).toEqual({ appKey: "chave-teste", appSecret: "segredo-teste" });
  });

  it("lança erro claro quando OMIE_APP_KEY está ausente", () => {
    vi.stubEnv("OMIE_APP_KEY", "");
    vi.stubEnv("OMIE_APP_SECRET", "segredo-teste");

    expect(() => credenciaisOmieOuFalha()).toThrow(/Credenciais da Omie não configuradas/);
  });

  it("lança erro claro quando OMIE_APP_SECRET está ausente", () => {
    vi.stubEnv("OMIE_APP_KEY", "chave-teste");
    vi.stubEnv("OMIE_APP_SECRET", "");

    expect(() => credenciaisOmieOuFalha()).toThrow(/Credenciais da Omie não configuradas/);
  });
});
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `pnpm test -- op-cache.test.ts`
Expected: FAIL — `Cannot find module './op-cache.js'`.

- [ ] **Step 3: Implementar `op-cache.ts`**

```typescript
import path from "node:path";
import type Database from "better-sqlite3";
import { abrirBanco, diretorioDados, hashCredencial } from "omie-data";

export function caminhoBancoAtivo(appKey: string): string {
  return path.join(diretorioDados(), `${hashCredencial(appKey)}.db`);
}

export interface CredenciaisOmie {
  appKey: string;
  appSecret: string;
}

export function credenciaisOmieOuFalha(): CredenciaisOmie {
  const appKey = process.env.OMIE_APP_KEY;
  const appSecret = process.env.OMIE_APP_SECRET;
  if (!appKey || !appSecret) {
    throw new Error(
      "Credenciais da Omie não configuradas. Defina OMIE_APP_KEY e OMIE_APP_SECRET no .env."
    );
  }
  return { appKey, appSecret };
}

export function abrirBancoAtivo(appKey: string): Database.Database {
  return abrirBanco(caminhoBancoAtivo(appKey));
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `pnpm test -- op-cache.test.ts`
Expected: PASS (5/5).

- [ ] **Step 5: Suíte completa + build + commit**

```bash
pnpm test
pnpm run build
git add src/modules/ordemProducao/infrastructure/cache/op-cache.ts src/modules/ordemProducao/infrastructure/cache/op-cache.test.ts
git commit -m "feat: helper op-cache — caminho de banco e credenciais ativas da Omie"
```

---

### Task 10: Ferramenta MCP `omie_op_atualizar_cache`

**Files:**
- Modify: `src/modules/ordemProducao/presentation/mcp/ordem-producao-tools.ts`

**Interfaces:**
- Consumes: `collectOrdemProducao`, `translateOrdemProducao`, `OmieHttpClientReal` (de `omie-data`, Task 8); `abrirBancoAtivo`, `credenciaisOmieOuFalha` (Task 9).

- [ ] **Step 1: Atualizar os imports no topo de `ordem-producao-tools.ts`**

Adicione:

```typescript
import { z } from "zod";
import { collectOrdemProducao, translateOrdemProducao, OmieHttpClientReal } from "omie-data";
import { abrirBancoAtivo, credenciaisOmieOuFalha } from "../../infrastructure/cache/op-cache.js";
```

- [ ] **Step 2: Adicionar a ferramenta nova ao array `ordemProducaoTools`**

Adicione como o último item do array (depois de `omie_op_listar_com_produto`, antes do `]`):

```typescript
  defineTool({
    name: "omie_op_atualizar_cache",
    description:
      "Atualiza o cache local de Ordens de Produção, buscando TODAS as OPs na Omie " +
      "(ListarOrdemProducao, paginado) e regravando o cache que omie_op_listar_com_produto lê. " +
      "Sem parâmetro. Chame antes de omie_op_listar_com_produto se precisar de dado mais recente " +
      "que o cache atual — a resposta de omie_op_listar_com_produto sempre informa a idade do dado " +
      "(geradoEm/idadeMs), então normalmente não é preciso chamar isto a cada pergunta.",
    inputSchema: { param: z.object({}).optional() },
    execute: async () => {
      const { appKey, appSecret } = credenciaisOmieOuFalha();
      const db = abrirBancoAtivo(appKey);
      try {
        const client = new OmieHttpClientReal(appKey, appSecret);
        const totalColetado = await collectOrdemProducao(db, client);
        translateOrdemProducao(db);
        return { totalColetado, atualizadoEm: new Date().toISOString() };
      } finally {
        db.close();
      }
    },
  }),
```

- [ ] **Step 3: Build**

Run: `pnpm run build`
Expected: sem erros de compilação.

- [ ] **Step 4: Verificação manual (sem teste unitário — ver Global Constraints)**

Com `OMIE_APP_KEY`/`OMIE_APP_SECRET` válidos no `.env` da raiz, rode:

```bash
node -e "
require('dotenv/config');
Promise.all([
  import('./dist/integrations/omie/omieClient.js'),
  import('./dist/tools/registry.js'),
]).then(async ([{ OmieClient }, { handleToolCall }]) => {
  const client = new OmieClient();
  const resultado = await handleToolCall(client, 'omie_op_atualizar_cache', {});
  console.log(JSON.stringify(resultado, null, 2));
});
"
```

Expected: retorna `{ totalColetado: <número > 0>, atualizadoEm: "<ISO timestamp>" }`, sem erro. Confirme que `totalColetado` bate com o total de OPs esperado (ex: ~1570, conforme visto na exploração manual anterior).

- [ ] **Step 5: Commit**

```bash
git add src/modules/ordemProducao/presentation/mcp/ordem-producao-tools.ts
git commit -m "feat: ferramenta omie_op_atualizar_cache — coleta+traduz OPs pro cache local"
```

---

### Task 11: Migrar `omie_op_listar_com_produto` pro cache + remover use-case morto

**Files:**
- Modify: `src/modules/ordemProducao/presentation/mcp/ordem-producao-tools.ts`
- Modify: `src/modules/ordemProducao/application/dto/listar-ops-com-produto.dto.ts`
- Delete: `src/modules/ordemProducao/application/use-cases/listar-ops-com-produto.ts`
- Delete: `src/modules/ordemProducao/application/use-cases/listar-ops-com-produto.test.ts`

**Interfaces:**
- Consumes: `consultarOrdensProducao`, `FiltrosOrdensProducao` (de `omie-data`, Task 8); `aplicarFiltros` (já existe em `src/shared/filtro.js`).
- Produces: `ListarOpsComProdutoResult` ganha `geradoEm: string | null` e `idadeMs: number | null` (aditivo — não quebra quem já lê os campos existentes).

- [ ] **Step 1: Atualizar o DTO — adicionar `geradoEm`/`idadeMs`**

Em `listar-ops-com-produto.dto.ts`, altere `ListarOpsComProdutoResult`:

```typescript
export interface ListarOpsComProdutoResult {
  pagina: number;
  totalPaginas: number;
  totalRegistros: number;
  itens: OrdemProducaoComProduto[];
  geradoEm: string | null;
  idadeMs: number | null;
}
```

(o resto do arquivo — `listarOpsComProdutoParamSchema`, `OrdemProducaoComProduto` — fica igual.)

- [ ] **Step 2: Remover o use-case morto e seu teste**

```bash
git rm src/modules/ordemProducao/application/use-cases/listar-ops-com-produto.ts
git rm src/modules/ordemProducao/application/use-cases/listar-ops-com-produto.test.ts
```

- [ ] **Step 3: Atualizar imports em `ordem-producao-tools.ts`**

Remova a linha:
```typescript
import { ListarOpsComProdutoUseCase } from "../../application/use-cases/listar-ops-com-produto.js";
```

Adicione:
```typescript
import { consultarOrdensProducao, type FiltrosOrdensProducao } from "omie-data";
import { aplicarFiltros } from "../../../../shared/filtro.js";
```

E troque a linha existente:
```typescript
import { listarOpsComProdutoParamSchema } from "../../application/dto/listar-ops-com-produto.dto.js";
```
por (acrescentando `OrdemProducaoComProduto` como type import no mesmo módulo, em vez de uma linha de import separada):
```typescript
import { listarOpsComProdutoParamSchema, type OrdemProducaoComProduto } from "../../application/dto/listar-ops-com-produto.dto.js";
```

Verifique se `criarProdutosGateway` (importado de `../../infrastructure/gateways/op-gateway-factory.js`) ainda é usado em algum outro lugar do arquivo depois desta mudança — se não for (era usado só pelo use-case removido), remova esse nome do import, mas mantenha `criarOpGateway` (ainda usado pelos tools de escrita: incluir/alterar/excluir/consultar).

- [ ] **Step 4: Substituir a definição de `omie_op_listar_com_produto`**

Troque o bloco inteiro da ferramenta (o que tinha `execute: async (client, param) => { ... new ListarOpsComProdutoUseCase ... }`) por:

```typescript
  defineTool({
    name: "omie_op_listar_com_produto",
    description:
      "Lista Ordens de Produção JÁ com a descrição/SKU do produto de cada OP, lendo de um CACHE " +
      "LOCAL (não bate na Omie a cada chamada — chame omie_op_atualizar_cache antes se precisar de " +
      "dado mais recente que o cache atual). A resposta inclui geradoEm/idadeMs informando a idade " +
      "do dado. Também expõe 'concluida' (true/false, campo confiável) além do 'etapaCodigo' cru " +
      "(a etapa do kanban é configurável por conta — de 3 a 6 fases com nomes próprios — e a API " +
      "não tem endpoint pra traduzir o código pro nome; se você souber o significado das etapas " +
      "dessa conta, pode interpretar etapaCodigo). Suporta paginação (pagina/registros_por_pagina, " +
      "agora aplicada sobre o cache local), o filtro apenas_nao_concluidas e o parâmetro genérico " +
      "'filtros' — lista de critérios (campo/operador/valor) aplicados sobre QUALQUER campo do " +
      "resultado já enriquecido (ex: descricaoProduto, codigoSku, quantidade), com operadores " +
      "igual/diferente/contem/maior_que/menor_que/entre. Ex: filtros: [{ campo: " +
      "'descricaoProduto', operador: 'contem', valor: '100kg' }].",
    inputSchema: { param: listarOpsComProdutoParamSchema },
    execute: async (_client, param) => {
      const parsed = listarOpsComProdutoParamSchema.parse(param);
      const { appKey } = credenciaisOmieOuFalha();
      const db = abrirBancoAtivo(appKey);
      try {
        const filtros: FiltrosOrdensProducao = { apenasNaoConcluidas: parsed.apenas_nao_concluidas };
        const resultado = consultarOrdensProducao(db, filtros);

        if (resultado.status === "sem_dado") {
          return {
            pagina: 1,
            totalPaginas: 0,
            totalRegistros: 0,
            itens: [],
            geradoEm: null,
            idadeMs: null,
            aviso: "Nenhuma OP no cache ainda — rode omie_op_atualizar_cache primeiro.",
          };
        }

        let itens: OrdemProducaoComProduto[] = resultado.ordens.map((ordem) => ({
          numeroOP: ordem.numeroOp,
          codigoOP: ordem.codigoOp,
          codigoProduto: ordem.codigoProduto,
          codigoSku: ordem.codigoSku,
          descricaoProduto: ordem.descricaoProduto,
          quantidade: ordem.quantidade,
          dataPrevisao: ordem.dataPrevisao,
          dataInicio: ordem.dataInicio,
          dataConclusao: ordem.dataConclusao,
          concluida: ordem.concluida,
          etapaCodigo: ordem.etapaCodigo,
        }));

        itens = aplicarFiltros(itens, parsed.filtros);

        const pagina = parsed.pagina ?? 1;
        const registrosPorPagina = parsed.registros_por_pagina ?? 20;
        const totalRegistros = itens.length;
        const totalPaginas = Math.max(1, Math.ceil(totalRegistros / registrosPorPagina));
        const inicio = (pagina - 1) * registrosPorPagina;
        const paginaItens = itens.slice(inicio, inicio + registrosPorPagina);

        return {
          pagina,
          totalPaginas,
          totalRegistros,
          itens: paginaItens,
          geradoEm: resultado.geradoEm,
          idadeMs: resultado.idadeMs,
        };
      } finally {
        db.close();
      }
    },
  }),
```

- [ ] **Step 5: Build + suíte completa da raiz**

```bash
pnpm run build
pnpm test
```

Expected: build limpo; suíte passa (o teste do use-case removido some da contagem, nenhum outro teste deve quebrar).

- [ ] **Step 6: Verificação manual — confirmar que o resultado bate com o que já vimos ao vivo antes**

```bash
node -e "
require('dotenv/config');
Promise.all([
  import('./dist/integrations/omie/omieClient.js'),
  import('./dist/tools/registry.js'),
]).then(async ([{ OmieClient }, { handleToolCall }]) => {
  const client = new OmieClient();
  const resultado = await handleToolCall(client, 'omie_op_listar_com_produto', { pagina: 1, registros_por_pagina: 5 });
  console.log(JSON.stringify(resultado, null, 2));
});
"
```

Expected: 5 itens com `descricaoProduto`/`codigoSku` preenchidos (mesmo formato que a exploração manual anterior mostrou), mais `geradoEm` (timestamp de quando `omie_op_atualizar_cache` rodou na Task 10) e `idadeMs` (> 0).

- [ ] **Step 7: Commit**

```bash
git add src/modules/ordemProducao/presentation/mcp/ordem-producao-tools.ts src/modules/ordemProducao/application/dto/listar-ops-com-produto.dto.ts
git commit -m "feat: omie_op_listar_com_produto passa a ler do cache local (omie-data), remove use-case ao vivo"
```

---

### Task 12: Verificação final de ponta a ponta

**Files:** nenhum arquivo novo — só verificação.

- [ ] **Step 1: Suíte completa + build dos dois pacotes**

```bash
cd packages/omie-data && rm -rf dist && npm test && npm run build
cd ../..
pnpm test
pnpm run build
```

Expected: os dois 100% limpos.

- [ ] **Step 2: Fluxo real completo — atualizar cache do zero e listar**

```bash
node -e "
require('dotenv/config');
Promise.all([
  import('./dist/integrations/omie/omieClient.js'),
  import('./dist/tools/registry.js'),
]).then(async ([{ OmieClient }, { handleToolCall }]) => {
  const client = new OmieClient();
  const atualizado = await handleToolCall(client, 'omie_op_atualizar_cache', {});
  console.log('atualizar:', JSON.stringify(atualizado));
  const listado = await handleToolCall(client, 'omie_op_listar_com_produto', { pagina: 1, registros_por_pagina: 3, apenas_nao_concluidas: true });
  console.log('listar (só não concluídas):', JSON.stringify(listado, null, 2));
});
"
```

Expected: `atualizar` retorna `totalColetado` consistente com o total real de
OPs na conta; `listar` retorna só OPs com `concluida: false`, com
`geradoEm`/`idadeMs` preenchidos.

- [ ] **Step 3: Confirmar que nada fora de `packages/omie-data` e `src/modules/ordemProducao/` foi tocado por engano**

Run: `git diff --stat <commit-antes-da-task-1>..HEAD -- . ':(exclude)packages/omie-data' ':(exclude)src/modules/ordemProducao'`
Expected: vazio (ou só `src/index.ts`/`package.json`/`pnpm-lock.yaml` se algo desse plano precisou tocar lá — não deveria).

Este task não gera commit — é só checagem antes de considerar o plano concluído.

---

## Resumo de tasks

| # | Task |
|---|------|
| 1 | Tipo `OrdemProducaoOmieBruta` |
| 2 | `IOrdemProducaoHttpClient` + `FakeHttpClient` |
| 3 | Schema `raw_ordens_producao` + `view_ordens_producao` |
| 4 | `collectOrdemProducao` |
| 5 | `translateOrdemProducao` |
| 6 | `consultarOrdensProducao` |
| 7 | `OmieHttpClientReal.listarOrdensProducaoPagina` |
| 8 | Exportar API pública de `omie-data` |
| 9 | Helper `op-cache.ts` (raiz) |
| 10 | Ferramenta `omie_op_atualizar_cache` |
| 11 | Migrar `omie_op_listar_com_produto` pro cache + remover use-case morto |
| 12 | Verificação final de ponta a ponta |

## Fora de escopo

- Ferramentas de escrita de OP (`omie_op_incluir/alterar/excluir`) — continuam ao vivo.
- Skill/CLI do `omie-data` pra OP.
- Sync incremental, TTL automático, divisão de banco por módulo.
- Migrar Produtos/Estoque pro servidor MCP.
- Outros módulos do Chão de Fábrica (Pedidos, Estrutura, Movimentações).
