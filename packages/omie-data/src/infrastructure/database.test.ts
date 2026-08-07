import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { abrirBanco } from "./database.js";

describe("abrirBanco", () => {
  let dirTemporario: string | undefined;

  afterEach(() => {
    if (dirTemporario && existsSync(dirTemporario)) {
      rmSync(dirTemporario, { recursive: true, force: true });
      dirTemporario = undefined;
    }
  });

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

  it("liga journal_mode = WAL e busy_timeout num banco em arquivo", () => {
    dirTemporario = mkdtempSync(join(tmpdir(), "omie-data-db-"));
    const db = abrirBanco(join(dirTemporario, "wal.sqlite"));

    // WAL: leitor e escritor deixam de se excluir. O MCP escreve o cache de OP
    // por dezenas de segundos no MESMO arquivo que o CLI lê — sem WAL, uma
    // coleta simultânea estoura SQLITE_BUSY.
    expect(db.pragma("journal_mode", { simple: true })).toBe("wal");
    expect(db.pragma("busy_timeout", { simple: true })).toBe(5000);

    db.close();
  });

  it("não quebra em banco :memory:, que ignora WAL mas aceita busy_timeout", () => {
    const db = abrirBanco(":memory:");

    // O SQLite silenciosamente MANTÉM journal_mode = memory pra bancos em
    // memória (não é erro), então o pragma pode ser aplicado sem branch.
    expect(db.pragma("journal_mode", { simple: true })).toBe("memory");
    expect(db.pragma("busy_timeout", { simple: true })).toBe(5000);

    db.close();
  });

  it("com WAL, um leitor lê enquanto outra conexão está no meio de uma escrita", () => {
    // É o cenário que o cache compartilhado criou: o MCP escreve as OPs por
    // dezenas de segundos enquanto o CLI/skill lê o MESMO arquivo. Sem WAL,
    // esta leitura estouraria SQLITE_BUSY.
    dirTemporario = mkdtempSync(join(tmpdir(), "omie-data-db-"));
    const caminho = join(dirTemporario, "concorrente.sqlite");

    const escritor = abrirBanco(caminho);
    const leitor = abrirBanco(caminho);

    escritor.prepare("BEGIN IMMEDIATE").run();
    escritor
      .prepare("INSERT INTO raw_produtos (codigo_produto, payload_json, coletado_em) VALUES (?, ?, ?)")
      .run(7, "{}", "2026-01-01T00:00:00.000Z");

    expect(() => leitor.prepare("SELECT COUNT(*) AS n FROM raw_produtos").get()).not.toThrow();

    escritor.prepare("COMMIT").run();
    leitor.close();
    escritor.close();
  });

  it("abre banco pré-existente e povoado sem perder dado ao migrar pra WAL", () => {
    dirTemporario = mkdtempSync(join(tmpdir(), "omie-data-db-"));
    const caminho = join(dirTemporario, "povoado.sqlite");

    const db1 = abrirBanco(caminho);
    db1
      .prepare("INSERT INTO raw_produtos (codigo_produto, payload_json, coletado_em) VALUES (?, ?, ?)")
      .run(1, JSON.stringify({ codigo_produto: 1 }), "2026-01-01T00:00:00.000Z");
    db1.close();

    const db2 = abrirBanco(caminho);
    const linhas = db2.prepare("SELECT codigo_produto FROM raw_produtos").all() as any[];
    expect(linhas).toEqual([{ codigo_produto: 1 }]);
    expect(db2.pragma("journal_mode", { simple: true })).toBe("wal");
    db2.close();
  });

  it("abrir o banco duas vezes num arquivo real não quebra (migração de colunas já existentes)", () => {
    dirTemporario = mkdtempSync(join(tmpdir(), "omie-data-db-"));
    const caminho = join(dirTemporario, "teste.sqlite");

    const db1 = abrirBanco(caminho);
    db1.close();

    // Segunda abertura: view_produtos já existe com as colunas de estoque —
    // exercita o branch de "duplicate column name" ignorado no catch.
    expect(() => {
      const db2 = abrirBanco(caminho);
      const cols = db2.prepare("PRAGMA table_info(view_produtos)").all() as any[];
      const nomes = cols.map((c: any) => c.name);
      expect(nomes).toContain("quantidade_em_estoque");
      expect(nomes).toContain("valor_em_estoque_custo");
      expect(nomes).toContain("valor_em_estoque_venda");
      db2.close();
    }).not.toThrow();
  });
});
