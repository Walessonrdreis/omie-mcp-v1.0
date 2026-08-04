# Filtros da view_produtos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar filtros `--busca`, `--categoria`, `--ativo` à consulta de `view_produtos` no CLI `omie-data`, mais um modo `--ajuda` que imprime lista estática (sem TTY, ex.: chamado pela skill) ou abre um prompt interativo com live-search (TTY real).

**Architecture:** `consultarProdutos` ganha um parâmetro opcional de filtros e monta um `WHERE` parametrizado sobre `view_produtos` (SELECT único, sem join novo — mantém ADR-0001). `cli.ts` ganha parsing das novas flags e roteia pra um branch estático ou pro novo módulo `rodar-ajuda-interativo.ts`, que usa `@inquirer/prompts` (`select` + `search`) injetado por interface pra ser testável sem TTY real.

**Tech Stack:** TypeScript, better-sqlite3, vitest, `@inquirer/prompts` (novo).

## Global Constraints

- Uma View por pergunta do usuário — nenhum join novo na Consulta; filtros são só `WHERE` sobre `view_produtos` (ver `packages/omie-data/CONTEXT.md` e ADR-0001).
- `ativo` aceita `sim`/`nao` (com ou sem acento) na flag, mapeado pra `"Sim"`/`"Não"` — mesmo formato já salvo na view.
- Filtros combinam sempre com AND.
- `--ajuda`: `process.stdout.isTTY === true` → prompt interativo; caso contrário → texto estático (nunca tentar abrir prompt sem TTY, trava o processo).
- Prompt interativo não suporta mouse — só seta/Enter (limitação aceita, documentada na spec).
- Nova dependência de produção: `@inquirer/prompts`.

---

### Task 1: Filtros em `consultarProdutos`

**Files:**
- Modify: `packages/omie-data/src/application/consultar-produtos.ts`
- Test: `packages/omie-data/src/application/consultar-produtos.test.ts`

**Interfaces:**
- Produces: `export interface FiltrosProdutos { busca?: string; categoria?: string; ativo?: "Sim" | "Não"; }` e `consultarProdutos(db: Database.Database, filtros?: FiltrosProdutos): ResultadoConsultaProdutos` (assinatura anterior sem segundo argumento continua válida — parâmetro opcional).

- [ ] **Step 1: Escrever os testes que falham**

Adicionar ao final de `packages/omie-data/src/application/consultar-produtos.test.ts` (dentro do `describe("consultarProdutos", ...)`):

```ts
  it("filtra por busca (nome ou código), case-insensitive", () => {
    const db = abrirBanco(":memory:");
    const gerado = new Date().toISOString();
    db.prepare(`
      INSERT INTO view_produtos (codigo_produto, codigo, nome, categoria, unidade, valor_formatado, ativo, gerado_em)
      VALUES (1, 'ABC123', 'Arroz Branco', 'Grãos', 'UN', 'R$ 10,00', 'Sim', ?),
             (2, 'XYZ999', 'Feijão Preto', 'Grãos', 'UN', 'R$ 8,00', 'Sim', ?)
    `).run(gerado, gerado);

    const porNome = consultarProdutos(db, { busca: "arroz" });
    expect(porNome.produtos).toHaveLength(1);
    expect(porNome.produtos[0].nome).toBe("Arroz Branco");

    const porCodigo = consultarProdutos(db, { busca: "xyz999" });
    expect(porCodigo.produtos).toHaveLength(1);
    expect(porCodigo.produtos[0].nome).toBe("Feijão Preto");

    db.close();
  });

  it("filtra por categoria, substring case-insensitive", () => {
    const db = abrirBanco(":memory:");
    const gerado = new Date().toISOString();
    db.prepare(`
      INSERT INTO view_produtos (codigo_produto, codigo, nome, categoria, unidade, valor_formatado, ativo, gerado_em)
      VALUES (1, 'A', 'Produto A', 'Bebidas Alcoólicas', 'UN', 'R$ 10,00', 'Sim', ?),
             (2, 'B', 'Produto B', 'Limpeza', 'UN', 'R$ 8,00', 'Sim', ?)
    `).run(gerado, gerado);

    const resultado = consultarProdutos(db, { categoria: "bebida" });
    expect(resultado.produtos).toHaveLength(1);
    expect(resultado.produtos[0].nome).toBe("Produto A");

    db.close();
  });

  it("filtra por ativo, igualdade exata", () => {
    const db = abrirBanco(":memory:");
    const gerado = new Date().toISOString();
    db.prepare(`
      INSERT INTO view_produtos (codigo_produto, codigo, nome, categoria, unidade, valor_formatado, ativo, gerado_em)
      VALUES (1, 'A', 'Produto A', 'Cat', 'UN', 'R$ 10,00', 'Sim', ?),
             (2, 'B', 'Produto B', 'Cat', 'UN', 'R$ 8,00', 'Não', ?)
    `).run(gerado, gerado);

    const resultado = consultarProdutos(db, { ativo: "Não" });
    expect(resultado.produtos).toHaveLength(1);
    expect(resultado.produtos[0].nome).toBe("Produto B");

    db.close();
  });

  it("combina múltiplos filtros com AND", () => {
    const db = abrirBanco(":memory:");
    const gerado = new Date().toISOString();
    db.prepare(`
      INSERT INTO view_produtos (codigo_produto, codigo, nome, categoria, unidade, valor_formatado, ativo, gerado_em)
      VALUES (1, 'A', 'Arroz Branco', 'Grãos', 'UN', 'R$ 10,00', 'Sim', ?),
             (2, 'B', 'Arroz Integral', 'Grãos', 'UN', 'R$ 12,00', 'Não', ?)
    `).run(gerado, gerado);

    const resultado = consultarProdutos(db, { busca: "arroz", ativo: "Sim" });
    expect(resultado.produtos).toHaveLength(1);
    expect(resultado.produtos[0].nome).toBe("Arroz Branco");

    db.close();
  });
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npm --prefix packages/omie-data run test -- consultar-produtos`
Expected: FAIL — `consultarProdutos` ainda não aceita segundo argumento (os filtros são ignorados, todos os produtos voltam).

- [ ] **Step 3: Implementar os filtros**

Substituir o corpo de `packages/omie-data/src/application/consultar-produtos.ts` (mantendo a interface `ResultadoConsultaProdutos` já existente) por:

```ts
import type Database from "better-sqlite3";
import { ProdutoView } from "../domain/produto.js";

export interface ResultadoConsultaProdutos {
  status: "sem_dado" | "dado_disponivel";
  produtos: ProdutoView[];
  geradoEm: string | null;
  idadeMs: number | null;
}

export interface FiltrosProdutos {
  busca?: string;
  categoria?: string;
  ativo?: "Sim" | "Não";
}

export function consultarProdutos(
  db: Database.Database,
  filtros?: FiltrosProdutos
): ResultadoConsultaProdutos {
  const condicoes: string[] = [];
  const parametros: unknown[] = [];

  if (filtros?.busca) {
    condicoes.push("(LOWER(nome) LIKE ? OR LOWER(codigo) LIKE ?)");
    const termo = `%${filtros.busca.toLowerCase()}%`;
    parametros.push(termo, termo);
  }

  if (filtros?.categoria) {
    condicoes.push("LOWER(categoria) LIKE ?");
    parametros.push(`%${filtros.categoria.toLowerCase()}%`);
  }

  if (filtros?.ativo) {
    condicoes.push("ativo = ?");
    parametros.push(filtros.ativo);
  }

  const where = condicoes.length > 0 ? `WHERE ${condicoes.join(" AND ")}` : "";

  const linhas = db
    .prepare(
      `SELECT codigo_produto, codigo, nome, categoria, unidade, valor_formatado, ativo, gerado_em FROM view_produtos ${where} ORDER BY gerado_em DESC`
    )
    .all(...parametros) as Array<{
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

Nota: com filtro aplicado e zero resultados, o status retornado é `"sem_dado"` — mesmo status usado quando a view está vazia. Isso é aceitável porque o consumidor (skill) já trata `sem_dado` como "nenhum produto pra mostrar"; não precisamos de um terceiro status só pra distinguir "vazio de verdade" de "filtro não encontrou nada".

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npm --prefix packages/omie-data run test -- consultar-produtos`
Expected: PASS (todos os testes, incluindo os 2 pré-existentes e os 4 novos)

- [ ] **Step 5: Commit**

```bash
git add packages/omie-data/src/application/consultar-produtos.ts packages/omie-data/src/application/consultar-produtos.test.ts
git commit -m "feat(omie-data): consultarProdutos aceita filtros busca/categoria/ativo combinados com AND"
```

---

### Task 2: Flags `--busca`, `--categoria`, `--ativo` em `parseArgv`

**Files:**
- Modify: `packages/omie-data/src/cli.ts`
- Test: `packages/omie-data/src/cli.test.ts`

**Interfaces:**
- Consumes: nenhuma nova (usa `valorDaFlag` já existente em `cli.ts`).
- Produces: `ComandoCli` do tipo `"produtos"` ganha os campos `filtros: FiltrosProdutos` (import de `./application/consultar-produtos.js`) e `ajuda: boolean`. Tasks seguintes consomem `comando.filtros` e `comando.ajuda`.

- [ ] **Step 1: Escrever os testes que falham**

Adicionar ao `packages/omie-data/src/cli.test.ts`, substituindo os dois testes existentes de `"produtos"` por:

```ts
  it("reconhece 'produtos' sem flags", () => {
    const comando = parseArgv(["produtos"]);
    expect(comando).toEqual({ tipo: "produtos", atualizar: false, ajuda: false, filtros: {} });
  });

  it("reconhece 'produtos --atualizar'", () => {
    const comando = parseArgv(["produtos", "--atualizar"]);
    expect(comando).toEqual({ tipo: "produtos", atualizar: true, ajuda: false, filtros: {} });
  });

  it("reconhece 'produtos --busca arroz'", () => {
    const comando = parseArgv(["produtos", "--busca", "arroz"]);
    expect(comando).toEqual({ tipo: "produtos", atualizar: false, ajuda: false, filtros: { busca: "arroz" } });
  });

  it("reconhece 'produtos --categoria bebida'", () => {
    const comando = parseArgv(["produtos", "--categoria", "bebida"]);
    expect(comando).toEqual({ tipo: "produtos", atualizar: false, ajuda: false, filtros: { categoria: "bebida" } });
  });

  it("reconhece 'produtos --ativo sim' e 'produtos --ativo nao' (com ou sem acento)", () => {
    expect(parseArgv(["produtos", "--ativo", "sim"])).toEqual({
      tipo: "produtos", atualizar: false, ajuda: false, filtros: { ativo: "Sim" },
    });
    expect(parseArgv(["produtos", "--ativo", "nao"])).toEqual({
      tipo: "produtos", atualizar: false, ajuda: false, filtros: { ativo: "Não" },
    });
    expect(parseArgv(["produtos", "--ativo", "não"])).toEqual({
      tipo: "produtos", atualizar: false, ajuda: false, filtros: { ativo: "Não" },
    });
  });

  it("retorna 'desconhecido' quando --ativo vem com valor inválido", () => {
    expect(parseArgv(["produtos", "--ativo", "talvez"])).toEqual({ tipo: "desconhecido" });
  });

  it("combina múltiplas flags de filtro", () => {
    const comando = parseArgv(["produtos", "--busca", "arroz", "--categoria", "grãos", "--ativo", "sim", "--atualizar"]);
    expect(comando).toEqual({
      tipo: "produtos",
      atualizar: true,
      ajuda: false,
      filtros: { busca: "arroz", categoria: "grãos", ativo: "Sim" },
    });
  });

  it("reconhece 'produtos --ajuda'", () => {
    const comando = parseArgv(["produtos", "--ajuda"]);
    expect(comando).toEqual({ tipo: "produtos", atualizar: false, ajuda: true, filtros: {} });
  });
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npm --prefix packages/omie-data run test -- cli.test`
Expected: FAIL — `parseArgv` ainda retorna só `{ tipo: "produtos", atualizar }`, sem `ajuda`/`filtros`.

- [ ] **Step 3: Implementar o parsing**

Em `packages/omie-data/src/cli.ts`, adicionar o import e alterar o tipo e a função:

```ts
import { FiltrosProdutos } from "./application/consultar-produtos.js";
```

Substituir o tipo `ComandoCli` e o bloco `if (sub === "produtos")` de `parseArgv`:

```ts
export type ComandoCli =
  | { tipo: "configurar"; appKey: string; appSecret: string }
  | { tipo: "produtos"; atualizar: boolean; ajuda: boolean; filtros: FiltrosProdutos }
  | { tipo: "desconhecido" };
```

```ts
  if (sub === "produtos") {
    const filtros: FiltrosProdutos = {};

    const busca = valorDaFlag(resto, "--busca");
    if (busca) filtros.busca = busca;

    const categoria = valorDaFlag(resto, "--categoria");
    if (categoria) filtros.categoria = categoria;

    const ativoBruto = valorDaFlag(resto, "--ativo");
    if (ativoBruto !== undefined) {
      const normalizado = ativoBruto.toLowerCase();
      if (normalizado === "sim") filtros.ativo = "Sim";
      else if (normalizado === "nao" || normalizado === "não") filtros.ativo = "Não";
      else return { tipo: "desconhecido" };
    }

    return {
      tipo: "produtos",
      atualizar: resto.includes("--atualizar"),
      ajuda: resto.includes("--ajuda"),
      filtros,
    };
  }
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npm --prefix packages/omie-data run test -- cli.test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/omie-data/src/cli.ts packages/omie-data/src/cli.test.ts
git commit -m "feat(omie-data): cli reconhece flags --busca, --categoria, --ativo e --ajuda"
```

---

### Task 3: `rodarProdutos` repassa filtros pra `consultarProdutos`

**Files:**
- Modify: `packages/omie-data/src/application/rodar-produtos.ts`
- Test: `packages/omie-data/src/application/rodar-produtos.test.ts`

**Interfaces:**
- Consumes: `FiltrosProdutos` e `consultarProdutos(db, filtros?)` de `./consultar-produtos.js` (Task 1).
- Produces: `rodarProdutos(db, client, atualizar, filtros?)` — quarto parâmetro opcional, assinatura anterior de 3 args continua válida.

- [ ] **Step 1: Escrever o teste que falha**

Adicionar ao `packages/omie-data/src/application/rodar-produtos.test.ts`:

```ts
  it("repassa filtros pra consultarProdutos", async () => {
    const db = abrirBanco(":memory:");
    const client = new FakeOmieHttpClient([
      { codigo_produto: 1, codigo: "A", descricao: "Arroz Branco", unidade: "UN", valor_unitario: 10, inativo: "N", codigo_familia: 1, descricao_familia: "Grãos" },
      { codigo_produto: 2, codigo: "B", descricao: "Feijão Preto", unidade: "UN", valor_unitario: 8, inativo: "N", codigo_familia: 1, descricao_familia: "Grãos" },
    ]);

    const resultado = await rodarProdutos(db, client, true, { busca: "arroz" });

    expect(resultado.status).toBe("dado_disponivel");
    expect(resultado.produtos).toHaveLength(1);
    expect(resultado.produtos[0].nome).toBe("Arroz Branco");

    db.close();
  });
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npm --prefix packages/omie-data run test -- rodar-produtos`
Expected: FAIL (TypeScript ou runtime — `rodarProdutos` não aceita 4º argumento, filtro é ignorado e os 2 produtos voltam)

- [ ] **Step 3: Implementar**

Substituir `packages/omie-data/src/application/rodar-produtos.ts`:

```ts
import type Database from "better-sqlite3";
import { IOmieHttpClient } from "../domain/omie-http-client.js";
import { collectProdutos } from "./collect-produtos.js";
import { translateProdutos } from "./translate-produtos.js";
import { consultarProdutos, FiltrosProdutos, ResultadoConsultaProdutos } from "./consultar-produtos.js";

export async function rodarProdutos(
  db: Database.Database,
  client: IOmieHttpClient,
  atualizar: boolean,
  filtros?: FiltrosProdutos
): Promise<ResultadoConsultaProdutos> {
  if (atualizar) {
    await collectProdutos(db, client);
    translateProdutos(db);
  }

  return consultarProdutos(db, filtros);
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npm --prefix packages/omie-data run test -- rodar-produtos`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/omie-data/src/application/rodar-produtos.ts packages/omie-data/src/application/rodar-produtos.test.ts
git commit -m "feat(omie-data): rodarProdutos repassa filtros opcionais pra consultarProdutos"
```

---

### Task 4: Ajuda estática (`--ajuda` sem TTY) e wiring dos filtros em `main()`

**Files:**
- Modify: `packages/omie-data/src/cli.ts`
- Test: `packages/omie-data/src/cli.test.ts`

**Interfaces:**
- Produces: `export function textoAjudaProdutos(): string` — usada por `main()` e testável isoladamente.

- [ ] **Step 1: Escrever o teste que falha**

Adicionar ao `packages/omie-data/src/cli.test.ts` (novo `import` no topo: `import { parseArgv, textoAjudaProdutos } from "./cli.js";`, substituindo o import atual):

```ts
describe("textoAjudaProdutos", () => {
  it("lista cada filtro disponível com um exemplo de uso", () => {
    const texto = textoAjudaProdutos();
    expect(texto).toContain("--busca <texto>");
    expect(texto).toContain("produtos --busca arroz");
    expect(texto).toContain("--categoria <texto>");
    expect(texto).toContain("produtos --categoria bebida");
    expect(texto).toContain("--ativo <sim|nao>");
    expect(texto).toContain("produtos --ativo sim");
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npm --prefix packages/omie-data run test -- cli.test`
Expected: FAIL — `textoAjudaProdutos` não existe.

- [ ] **Step 3: Implementar `textoAjudaProdutos` e wiring em `main()`**

Adicionar em `packages/omie-data/src/cli.ts`, antes de `async function main()`:

```ts
export function textoAjudaProdutos(): string {
  return [
    "Filtros disponíveis em 'produtos':",
    "  --busca <texto>      ex: produtos --busca arroz",
    "  --categoria <texto>  ex: produtos --categoria bebida",
    "  --ativo <sim|nao>    ex: produtos --ativo sim",
  ].join("\n");
}
```

Alterar o bloco `if (comando.tipo === "produtos")` de `main()` — inserir o branch de `--ajuda` logo após checar a credencial, e passar `comando.filtros` pra `rodarProdutos`:

```ts
  if (comando.tipo === "produtos") {
    const credencial = carregarCredencialAtiva();
    if (!credencial) {
      console.log(JSON.stringify({ status: "sem_credencial" }));
      process.exitCode = 1;
      return;
    }

    if (comando.ajuda && !process.stdout.isTTY) {
      console.log(textoAjudaProdutos());
      process.exitCode = 0;
      return;
    }

    let db;
    try {
      db = abrirBanco(path.join(diretorioDados(), `${credencial.hash}.db`));
      const client = new OmieHttpClientReal(credencial.appKey, credencial.appSecret);

      if (comando.ajuda) {
        const resultado = await rodarAjudaInterativa(db, client, comando.atualizar);
        console.log(JSON.stringify(resultado));
        process.exitCode = 0;
        return;
      }

      const resultado = await rodarProdutos(db, client, comando.atualizar, comando.filtros);
      console.log(JSON.stringify(resultado));
      process.exitCode = 0;
    } catch (erro) {
      console.log(JSON.stringify({ status: "erro", erro: erro instanceof Error ? erro.message : String(erro) }));
      process.exitCode = 1;
    } finally {
      db?.close();
    }
    return;
  }
```

Nota: `rodarAjudaInterativa` é importado da Task 5 (`./application/rodar-ajuda-interativo.js`) — este `import` é adicionado na Task 5, não aqui, pra manter esta task compilável sozinha caso a Task 5 ainda não exista. **Se rodar esta task isoladamente, comente temporariamente as 5 linhas do branch `if (comando.ajuda)` dentro do `try` (o branch de `!process.stdout.isTTY` já cobre o teste) e deixe um `// TODO Task 5` — a Task 5 substitui esse trecho pelo código final.**

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npm --prefix packages/omie-data run test -- cli.test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/omie-data/src/cli.ts packages/omie-data/src/cli.test.ts
git commit -m "feat(omie-data): --ajuda sem TTY imprime lista estática de filtros; main() repassa filtros pra rodarProdutos"
```

---

### Task 5: Modo interativo de `--ajuda` com `@inquirer/prompts`

**Files:**
- Modify: `packages/omie-data/package.json` (nova dependência)
- Create: `packages/omie-data/src/application/rodar-ajuda-interativo.ts`
- Create: `packages/omie-data/src/application/rodar-ajuda-interativo.test.ts`
- Modify: `packages/omie-data/src/cli.ts` (substitui o `// TODO Task 5` da Task 4 pela chamada real)

**Interfaces:**
- Consumes: `FiltrosProdutos`, `consultarProdutos`, `ResultadoConsultaProdutos` de `./consultar-produtos.js` (Task 1); `rodarProdutos` de `./rodar-produtos.js` (Task 3); `IOmieHttpClient` de `../domain/omie-http-client.js`.
- Produces: `export interface IPromptsInterativos { selecionarFiltro(): Promise<"busca" | "categoria" | "ativo" | "nenhum">; buscarTermo(fonte: (input: string) => string[]): Promise<string>; selecionarAtivo(): Promise<"Sim" | "Não">; }`, `export function criarPromptsReais(): IPromptsInterativos`, `export async function rodarAjudaInterativa(db: Database.Database, client: IOmieHttpClient, atualizar: boolean, prompts?: IPromptsInterativos): Promise<ResultadoConsultaProdutos>`.

- [ ] **Step 1: Adicionar a dependência**

Editar `packages/omie-data/package.json`, dentro de `"dependencies"`:

```json
  "dependencies": {
    "@inquirer/prompts": "^7.2.1",
    "better-sqlite3": "^11.3.0"
  },
```

Run: `npm --prefix packages/omie-data install`
Expected: instala `@inquirer/prompts` e atualiza `package-lock.json`.

- [ ] **Step 2: Escrever o teste que falha**

Criar `packages/omie-data/src/application/rodar-ajuda-interativo.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { abrirBanco } from "../infrastructure/database.js";
import { FakeOmieHttpClient } from "../infrastructure/fake-omie-http-client.js";
import { rodarAjudaInterativa, IPromptsInterativos } from "./rodar-ajuda-interativo.js";

function fakePrompts(overrides: Partial<IPromptsInterativos>): IPromptsInterativos {
  return {
    selecionarFiltro: async () => "nenhum",
    buscarTermo: async () => "",
    selecionarAtivo: async () => "Sim",
    ...overrides,
  };
}

describe("rodarAjudaInterativa", () => {
  it("filtro 'nenhum' retorna todos os produtos", async () => {
    const db = abrirBanco(":memory:");
    const client = new FakeOmieHttpClient([
      { codigo_produto: 1, codigo: "A", descricao: "Produto A", unidade: "UN", valor_unitario: 10, inativo: "N", codigo_familia: 1, descricao_familia: "Cat" },
    ]);

    const resultado = await rodarAjudaInterativa(db, client, true, fakePrompts({}));

    expect(resultado.status).toBe("dado_disponivel");
    expect(resultado.produtos).toHaveLength(1);

    db.close();
  });

  it("filtro 'busca' usa o termo escolhido no prompt e filtra o resultado", async () => {
    const db = abrirBanco(":memory:");
    const client = new FakeOmieHttpClient([
      { codigo_produto: 1, codigo: "A", descricao: "Arroz Branco", unidade: "UN", valor_unitario: 10, inativo: "N", codigo_familia: 1, descricao_familia: "Grãos" },
      { codigo_produto: 2, codigo: "B", descricao: "Feijão Preto", unidade: "UN", valor_unitario: 8, inativo: "N", codigo_familia: 1, descricao_familia: "Grãos" },
    ]);

    const resultado = await rodarAjudaInterativa(
      db,
      client,
      true,
      fakePrompts({ selecionarFiltro: async () => "busca", buscarTermo: async () => "Arroz Branco" })
    );

    expect(resultado.status).toBe("dado_disponivel");
    expect(resultado.produtos).toHaveLength(1);
    expect(resultado.produtos[0].nome).toBe("Arroz Branco");

    db.close();
  });

  it("filtro 'ativo' usa o valor escolhido no prompt", async () => {
    const db = abrirBanco(":memory:");
    const client = new FakeOmieHttpClient([
      { codigo_produto: 1, codigo: "A", descricao: "Produto A", unidade: "UN", valor_unitario: 10, inativo: "N", codigo_familia: 1, descricao_familia: "Cat" },
      { codigo_produto: 2, codigo: "B", descricao: "Produto B", unidade: "UN", valor_unitario: 8, inativo: "S", codigo_familia: 1, descricao_familia: "Cat" },
    ]);

    const resultado = await rodarAjudaInterativa(
      db,
      client,
      true,
      fakePrompts({ selecionarFiltro: async () => "ativo", selecionarAtivo: async () => "Não" })
    );

    expect(resultado.status).toBe("dado_disponivel");
    expect(resultado.produtos).toHaveLength(1);
    expect(resultado.produtos[0].nome).toBe("Produto B");

    db.close();
  });
});
```

- [ ] **Step 3: Rodar o teste e confirmar que falha**

Run: `npm --prefix packages/omie-data run test -- rodar-ajuda-interativo`
Expected: FAIL — módulo `./rodar-ajuda-interativo.js` não existe.

- [ ] **Step 4: Implementar**

Criar `packages/omie-data/src/application/rodar-ajuda-interativo.ts`:

```ts
import type Database from "better-sqlite3";
import { select, search } from "@inquirer/prompts";
import { IOmieHttpClient } from "../domain/omie-http-client.js";
import { rodarProdutos } from "./rodar-produtos.js";
import { FiltrosProdutos, ResultadoConsultaProdutos } from "./consultar-produtos.js";

export interface IPromptsInterativos {
  selecionarFiltro(): Promise<"busca" | "categoria" | "ativo" | "nenhum">;
  buscarTermo(fonte: (input: string) => string[]): Promise<string>;
  selecionarAtivo(): Promise<"Sim" | "Não">;
}

export function criarPromptsReais(): IPromptsInterativos {
  return {
    async selecionarFiltro() {
      return select({
        message: "Qual filtro você quer aplicar?",
        choices: [
          { name: "Busca (nome ou código)", value: "busca" as const },
          { name: "Categoria", value: "categoria" as const },
          { name: "Ativo", value: "ativo" as const },
          { name: "Sem filtro (listar tudo)", value: "nenhum" as const },
        ],
      });
    },
    async buscarTermo(fonte) {
      return search({
        message: "Digite pra filtrar (setinha + Enter pra escolher):",
        source: async (input) => {
          const termo = input ?? "";
          return fonte(termo).map((valor) => ({ name: valor, value: valor }));
        },
      });
    },
    async selecionarAtivo() {
      return select({
        message: "Ativo?",
        choices: [
          { name: "Sim", value: "Sim" as const },
          { name: "Não", value: "Não" as const },
        ],
      });
    },
  };
}

function valoresDistintos(db: Database.Database, coluna: "nome" | "categoria", termo: string): string[] {
  if (!termo) return [];
  const linhas = db
    .prepare(`SELECT DISTINCT ${coluna} AS valor FROM view_produtos WHERE LOWER(${coluna}) LIKE ? ORDER BY ${coluna} LIMIT 20`)
    .all(`%${termo.toLowerCase()}%`) as Array<{ valor: string }>;
  return linhas.map((linha) => linha.valor);
}

export async function rodarAjudaInterativa(
  db: Database.Database,
  client: IOmieHttpClient,
  atualizar: boolean,
  prompts: IPromptsInterativos = criarPromptsReais()
): Promise<ResultadoConsultaProdutos> {
  if (atualizar) {
    await rodarProdutos(db, client, true);
  }

  const filtroEscolhido = await prompts.selecionarFiltro();
  const filtros: FiltrosProdutos = {};

  if (filtroEscolhido === "busca") {
    filtros.busca = await prompts.buscarTermo((termo) => valoresDistintos(db, "nome", termo));
  } else if (filtroEscolhido === "categoria") {
    filtros.categoria = await prompts.buscarTermo((termo) => valoresDistintos(db, "categoria", termo));
  } else if (filtroEscolhido === "ativo") {
    filtros.ativo = await prompts.selecionarAtivo();
  }

  return rodarProdutos(db, client, false, filtros);
}
```

Depois, em `packages/omie-data/src/cli.ts`: adicionar `import { rodarAjudaInterativa } from "./application/rodar-ajuda-interativo.js";` no topo e remover o comentário `// TODO Task 5` deixado na Task 4 — o branch `if (comando.ajuda) { ... }` dentro do `try` já está com o código final (escrito na Task 4), só precisa estar descomentado.

- [ ] **Step 5: Rodar os testes e confirmar que passam**

Run: `npm --prefix packages/omie-data run test`
Expected: PASS (suíte inteira do pacote)

- [ ] **Step 6: Build**

Run: `npm --prefix packages/omie-data run build`
Expected: compila sem erros de tipo.

- [ ] **Step 7: Commit**

```bash
git add packages/omie-data/package.json packages/omie-data/package-lock.json packages/omie-data/src/application/rodar-ajuda-interativo.ts packages/omie-data/src/application/rodar-ajuda-interativo.test.ts packages/omie-data/src/cli.ts
git commit -m "feat(omie-data): modo interativo de --ajuda com live-search via @inquirer/prompts"
```

---

### Task 6: Atualizar a skill `/omie-data:produtos` pra usar os filtros

**Files:**
- Modify: `.claude/commands/omie-data/produtos.md`

- [ ] **Step 1: Editar as instruções da skill**

Substituir o conteúdo de `.claude/commands/omie-data/produtos.md` por:

```markdown
---
description: Consulta produtos reais na Omie via skill omie-data (cache traduzido) — pergunta antes de atualizar dado antigo.
argument-hint: pedido em texto livre, ex: "lista de produtos" ou "produtos de bebida" (opcional)
---

Objetivo: responder sobre produtos usando o cache traduzido da skill
`omie-data`, perguntando ao usuário antes de buscar dado novo na Omie.

1. Garanta que o pacote está compilado: `npm --prefix packages/omie-data run build`
2. Se o pedido do usuário já expressa um filtro em linguagem natural,
   traduza direto pra flag e pule pro passo 4:
   - nome ou código do produto → `--busca <termo>`
   - categoria/família (ex.: "produtos de bebida") → `--categoria <termo>`
   - "ativos"/"inativos"/"descontinuados" → `--ativo sim` ou `--ativo nao`
   - Combine flags se o pedido tiver mais de um filtro.
3. Se não houver filtro claro no pedido, rode
   `node packages/omie-data/dist/cli.js produtos --ajuda` — sem TTY, o CLI
   imprime uma lista estática de filtros (não tenta abrir prompt). Leia
   essa lista e ofereça os filtros como opções pro usuário escolher (ex.:
   via pergunta com botões), sem reformular ou gerar a lista você mesmo —
   reaproveite o texto que o CLI devolveu.
4. Rode: `node packages/omie-data/dist/cli.js produtos [flags escolhidas]`
5. O CLI imprime uma linha JSON. Trate cada caso:
   - `{"status":"sem_credencial"}` → avise que não há credencial
     configurada e sugira rodar `/omie-data:configurar` primeiro. Pare
     aqui.
   - `{"status":"sem_dado", ...}` → se não havia filtro aplicado, avise
     que ainda não há produtos coletados pra essa credencial e pergunte
     se quer buscar agora. Se havia filtro aplicado, diga que nenhum
     produto bateu com esse filtro (não é a mesma coisa que "sem dado
     nenhum coletado" — confira se `--atualizar` já foi usado antes de
     sugerir buscar de novo).
   - `{"status":"dado_disponivel","produtos":[...],"geradoEm":"...","idadeMs":N}`
     → informe a idade do dado (converta `idadeMs` pra algo legível, ex:
     "coletado há 2 horas") e pergunte se o usuário quer usar esse dado
     como está ou atualizar antes de responder.
6. Se o usuário confirmar que quer buscar/atualizar, rode de novo com
   `--atualizar` mais as mesmas flags de filtro, e use o resultado dessa
   segunda chamada daqui pra frente.
7. Formate a lista final de produtos pro usuário (nome, código, categoria,
   valor formatado, ativo/inativo) — nunca devolva o JSON cru do CLI.
   Se `produtos` vier vazio mesmo com `status: dado_disponivel`, diga
   isso claramente ("nenhum produto encontrado"), não é erro.
```

- [ ] **Step 2: Commit**

```bash
git add .claude/commands/omie-data/produtos.md
git commit -m "docs(omie-data): skill /omie-data:produtos usa filtros --busca/--categoria/--ativo e --ajuda"
```

---

## Verificação final

- [ ] Rodar `npm --prefix packages/omie-data run test` — suíte inteira passa.
- [ ] Rodar `npm --prefix packages/omie-data run build` — compila sem erro.
- [ ] Testar manualmente (fora do chat, terminal real com TTY):
  `node packages/omie-data/dist/cli.js produtos --ajuda` deve abrir o prompt interativo.
- [ ] Testar manualmente (simulando skill, sem TTY):
  `node packages/omie-data/dist/cli.js produtos --ajuda < /dev/null` deve imprimir a lista estática e sair (sem travar).
